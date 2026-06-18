#!/usr/bin/env python3
"""
Yacht Crew Uniform Image Crawler
─────────────────────────────────
Crawls yacht crew uniform & marine apparel websites, downloads product
images, renames them as:

    brand - style - colour - price.ext

and files them into:

    IMAGES/{category}/

Also writes IMAGES/database.csv, IMAGES/database.json, and a final report.

Usage:
    python crawler.py                    # crawl all enabled sites + categories
    python crawler.py --category caps    # single category only
    python crawler.py --site Musto       # single site only
    python crawler.py --static-only      # skip Playwright (requests + BS4 only)
    python crawler.py --limit 5          # only 5 images per category (quick test)
"""

import argparse
import asyncio
import csv
import hashlib
import io
import json
import logging
import os
import re
import sys
import time
import urllib.parse
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import aiofiles
import aiohttp
import requests
from bs4 import BeautifulSoup
from PIL import Image
import imagehash
from tqdm import tqdm
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

import colorlog

from config import (
    CATEGORIES,
    IMAGES_ROOT,
    MIN_VARIETIES,
    MIN_IMG_W,
    MIN_IMG_H,
    MAX_PAGES,
    TIMEOUT,
    HEADERS,
    REQUEST_DELAY,
    SITES,
    SiteConfig,
)

# ── Logging ───────────────────────────────────────────────────────────────────

handler = colorlog.StreamHandler()
handler.setFormatter(
    colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s  %(levelname)-8s%(reset)s %(message)s",
        datefmt="%H:%M:%S",
        log_colors={
            "DEBUG":    "cyan",
            "INFO":     "green",
            "WARNING":  "yellow",
            "ERROR":    "red",
            "CRITICAL": "bold_red",
        },
    )
)

log = logging.getLogger("crawler")
log.addHandler(handler)
log.setLevel(logging.INFO)

# ── Data model ────────────────────────────────────────────────────────────────

@dataclass
class ProductRecord:
    category:         str
    brand:            str
    style:            str
    colour:           str
    price:            str
    currency:         str
    source_website:   str
    product_url:      str
    image_url:        str
    local_path:       str
    date_downloaded:  str
    notes:            str
    crawl_status:     str  # "ok" | "skipped" | "error"


# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT = Path(IMAGES_ROOT)
DB_CSV  = ROOT / "database.csv"
DB_JSON = ROOT / "database.json"
REPORT  = ROOT / "crawl_report.txt"

CSV_FIELDS = [f.name for f in ProductRecord.__dataclass_fields__.values()]  # type: ignore[attr-defined]

# ── Seen-hashes for deduplication ─────────────────────────────────────────────

_seen_hashes: Set[str] = set()
_seen_urls:   Set[str] = set()

# ── Utility functions ─────────────────────────────────────────────────────────

def safe_filename(text: str, max_len: int = 60) -> str:
    """Sanitise a string so it can be used as a filename component."""
    text = str(text).strip()
    # collapse whitespace
    text = re.sub(r"\s+", " ", text)
    # remove/replace characters that are unsafe in filenames
    text = re.sub(r'[\\/:*?"<>|]', "", text)
    text = re.sub(r"[^\x20-\x7E]", "", text)  # non-ASCII out
    text = text.strip(" .")
    return text[:max_len] if text else "unknown"


def build_filename(brand: str, style: str, colour: str, price: str, ext: str) -> str:
    parts = [
        safe_filename(brand)  or "unknown brand",
        safe_filename(style)  or "unknown style",
        safe_filename(colour) or "colour unavailable",
        safe_filename(price)  or "price unavailable",
    ]
    return " - ".join(parts) + ext.lower()


def parse_price(raw: str) -> Tuple[str, str]:
    """Return (price_str, currency_symbol). E.g. '£42.00' → ('42.00', '£')."""
    raw = raw.strip()
    m = re.search(r"([£€$]?)\s*([\d,]+\.?\d*)", raw)
    if m:
        symbol = m.group(1) or ""
        amount = m.group(2).replace(",", "")
        return amount, symbol
    return raw, ""


def image_hash(img_bytes: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return str(imagehash.phash(img))
    except Exception:
        return hashlib.md5(img_bytes).hexdigest()


def is_acceptable_image(img_bytes: bytes) -> bool:
    try:
        img = Image.open(io.BytesIO(img_bytes))
        w, h = img.size
        return w >= MIN_IMG_W and h >= MIN_IMG_H
    except Exception:
        return False


def ensure_dirs():
    ROOT.mkdir(exist_ok=True)
    for cat_key, cat in CATEGORIES.items():
        (ROOT / cat_key).mkdir(exist_ok=True)
    log.info("Folder structure ready under %s/", IMAGES_ROOT)


def load_existing_db() -> List[ProductRecord]:
    records: List[ProductRecord] = []
    if DB_CSV.exists():
        with open(DB_CSV, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                try:
                    records.append(ProductRecord(**row))
                except TypeError:
                    pass
        for r in records:
            _seen_urls.add(r.image_url)
        log.info("Loaded %d existing records from database.", len(records))
    return records


def append_to_db(record: ProductRecord, all_records: List[ProductRecord]):
    all_records.append(record)
    write_mode = "a" if DB_CSV.exists() else "w"
    with open(DB_CSV, write_mode, newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
        if write_mode == "w":
            writer.writeheader()
        writer.writerow(asdict(record))


def save_json(all_records: List[ProductRecord]):
    with open(DB_JSON, "w", encoding="utf-8") as fh:
        json.dump([asdict(r) for r in all_records], fh, indent=2, ensure_ascii=False)


# ── HTTP helpers ──────────────────────────────────────────────────────────────

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.RequestException,)),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
def get_page(url: str, timeout: int = TIMEOUT) -> Optional[BeautifulSoup]:
    time.sleep(REQUEST_DELAY)
    try:
        resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException as exc:
        log.warning("GET failed: %s — %s", url, exc)
        raise


async def download_image_async(
    session: aiohttp.ClientSession,
    url: str,
    dest: Path,
) -> Optional[bytes]:
    """Download image; return raw bytes or None on failure."""
    for attempt in range(3):
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    return None
                data = await resp.read()
                return data
        except Exception as exc:
            if attempt == 2:
                log.warning("Image download failed: %s — %s", url, exc)
                return None
            await asyncio.sleep(2 ** attempt)
    return None


def resolve_url(base_url: str, href: str) -> str:
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("http"):
        return href
    return urllib.parse.urljoin(base_url, href)


def absolute_img_src(tag, site: SiteConfig) -> str:
    src = tag.get(site.image_attr) or tag.get("data-src") or tag.get("src") or ""
    src = src.strip()
    if not src or src.startswith("data:"):
        # try srcset
        srcset = tag.get("srcset", "")
        if srcset:
            parts = [p.strip().split(" ") for p in srcset.split(",") if p.strip()]
            # pick highest resolution
            best = sorted(parts, key=lambda p: float(p[1].rstrip("xw")) if len(p) > 1 else 1, reverse=True)
            if best:
                src = best[0][0]
    return resolve_url(site.base_url, src) if src else ""


# ── Product extraction ────────────────────────────────────────────────────────

def extract_product_from_page(
    soup: BeautifulSoup,
    product_url: str,
    site: SiteConfig,
) -> Dict:
    """Extract name, price, colour, image URL from a product detail page."""

    def text(sel: str) -> str:
        el = soup.select_one(sel)
        return el.get_text(strip=True) if el else ""

    name   = text(site.product_name_sel)  if site.product_name_sel  else ""
    price  = text(site.price_sel)         if site.price_sel          else ""
    colour = text(site.colour_sel)        if site.colour_sel          else ""

    # Fallback: title tag
    if not name:
        title_tag = soup.find("title")
        name = title_tag.get_text(strip=True) if title_tag else "unknown"

    # Find image
    img_url = ""
    if site.image_sel:
        img_tag = soup.select_one(site.image_sel)
        if img_tag:
            img_url = absolute_img_src(img_tag, site)

    # Broader fallback: largest og:image or first reasonably-sized img
    if not img_url:
        og = soup.find("meta", property="og:image")
        if og:
            img_url = og.get("content", "")
    if not img_url:
        for img in soup.find_all("img"):
            candidate = absolute_img_src(img, site)
            if candidate and not candidate.endswith((".gif", ".svg")):
                img_url = candidate
                break

    return {"name": name, "price": price, "colour": colour, "image_url": img_url}


def collect_product_links(soup: BeautifulSoup, site: SiteConfig) -> List[str]:
    links = []
    cards = soup.select(site.product_card_sel) if site.product_card_sel else []

    if cards:
        for card in cards:
            anchor = card.select_one(site.product_link_sel) if site.product_link_sel else card.find("a")
            if anchor and anchor.get("href"):
                links.append(resolve_url(site.base_url, anchor["href"]))
    else:
        # Fallback: every link that looks like a product URL
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if any(kw in href for kw in ["/product", "/products", "/item", "/p/"]):
                links.append(resolve_url(site.base_url, href))

    return list(dict.fromkeys(links))  # deduplicate while preserving order


def get_next_page_url(soup: BeautifulSoup, site: SiteConfig, current_url: str) -> Optional[str]:
    if not site.next_page_sel:
        return None
    next_a = soup.select_one(site.next_page_sel)
    if next_a and next_a.get("href"):
        return resolve_url(current_url, next_a["href"])
    return None


# ── Playwright scraping ───────────────────────────────────────────────────────

async def playwright_get_html(browser: Browser, url: str, wait_sel: str = "body") -> str:
    page: Page = await browser.new_page()
    await page.set_extra_http_headers(HEADERS)
    try:
        await page.goto(url, wait_until="networkidle", timeout=30_000)
        await page.wait_for_selector(wait_sel, timeout=10_000)
        # Scroll to trigger lazy loading
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, document.body.scrollHeight / 3)")
            await asyncio.sleep(0.8)
        return await page.content()
    except Exception as exc:
        log.warning("Playwright load failed: %s — %s", url, exc)
        return ""
    finally:
        await page.close()


# ── Core crawl logic ──────────────────────────────────────────────────────────

async def process_site_category(
    site: SiteConfig,
    category_key: str,
    category_urls: List[str],
    all_records: List[ProductRecord],
    counts: Dict[str, int],
    limit: Optional[int],
    browser: Optional[Browser],
    img_session: aiohttp.ClientSession,
) -> int:
    """Crawl one (site, category) pair. Returns number of new images saved."""
    saved = 0
    target = limit if limit else MIN_VARIETIES

    for start_url in category_urls:
        current_url = start_url
        page_num = 0

        while current_url and page_num < MAX_PAGES:
            page_num += 1
            log.info(
                "[%s] [%s] page %d — %s",
                site.name, category_key, page_num, current_url,
            )

            # Fetch HTML
            html = ""
            if site.js_required and browser:
                html = await playwright_get_html(browser, current_url)
            else:
                try:
                    soup_tmp = get_page(current_url)
                    html = str(soup_tmp) if soup_tmp else ""
                except Exception as exc:
                    log.error("Failed to fetch %s: %s", current_url, exc)
                    break

            if not html:
                break

            soup = BeautifulSoup(html, "lxml")
            product_links = collect_product_links(soup, site)
            log.debug("  Found %d product links", len(product_links))

            for prod_url in product_links:
                if prod_url in _seen_urls:
                    continue
                if counts.get(category_key, 0) >= target:
                    return saved

                # Fetch product detail page
                await asyncio.sleep(site.rate_limit)
                prod_html = ""
                if site.js_required and browser:
                    prod_html = await playwright_get_html(browser, prod_url, site.product_name_sel or "h1")
                else:
                    try:
                        prod_soup_tmp = get_page(prod_url)
                        prod_html = str(prod_soup_tmp) if prod_soup_tmp else ""
                    except Exception as exc:
                        log.warning("Product page failed: %s — %s", prod_url, exc)
                        continue

                if not prod_html:
                    continue

                prod_soup  = BeautifulSoup(prod_html, "lxml")
                prod_data  = extract_product_from_page(prod_soup, prod_url, site)
                img_url    = prod_data["image_url"]

                if not img_url or img_url in _seen_urls:
                    continue

                # Download image
                img_bytes = await download_image_async(img_session, img_url, ROOT)
                if not img_bytes:
                    continue
                if not is_acceptable_image(img_bytes):
                    log.debug("  Image too small, skipping: %s", img_url)
                    continue

                # Deduplication by perceptual hash
                h = image_hash(img_bytes)
                if h in _seen_hashes:
                    log.debug("  Duplicate image skipped: %s", img_url)
                    continue
                _seen_hashes.add(h)
                _seen_urls.add(img_url)

                # Build filename
                raw_price   = prod_data["price"]
                price_val, currency = parse_price(raw_price)
                colour = prod_data["colour"] or "colour unavailable"
                price_display = (
                    f"{currency}{price_val}" if price_val else "price unavailable"
                )

                ext = Path(urllib.parse.urlsplit(img_url).path).suffix
                if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
                    ext = ".jpg"

                filename = build_filename(
                    brand   = site.name,
                    style   = prod_data["name"],
                    colour  = colour,
                    price   = price_display,
                    ext     = ext,
                )

                dest = ROOT / category_key / filename
                # avoid overwrite collisions
                counter = 1
                stem    = dest.stem
                while dest.exists():
                    dest = dest.parent / f"{stem} ({counter}){ext}"
                    counter += 1

                async with aiofiles.open(dest, "wb") as fh:
                    await fh.write(img_bytes)

                record = ProductRecord(
                    category        = category_key,
                    brand           = site.name,
                    style           = prod_data["name"],
                    colour          = colour,
                    price           = price_val or "price unavailable",
                    currency        = currency or "",
                    source_website  = site.base_url,
                    product_url     = prod_url,
                    image_url       = img_url,
                    local_path      = str(dest),
                    date_downloaded = datetime.utcnow().isoformat(timespec="seconds"),
                    notes           = site.notes,
                    crawl_status    = "ok",
                )
                append_to_db(record, all_records)

                counts[category_key] = counts.get(category_key, 0) + 1
                saved += 1
                log.info(
                    "  ✓ [%s] %d/%d  %s",
                    category_key,
                    counts[category_key],
                    target,
                    filename[:80],
                )

            # Next page
            next_url = get_next_page_url(soup, site, current_url)
            current_url = next_url

    return saved


# ── Report ────────────────────────────────────────────────────────────────────

def write_report(all_records: List[ProductRecord], counts: Dict[str, int], elapsed: float):
    lines = [
        "=" * 70,
        "  YACHT CREW UNIFORM CRAWLER — FINAL REPORT",
        f"  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"  Elapsed:   {elapsed:.1f}s",
        "=" * 70,
        "",
        f"Total images downloaded: {len(all_records)}",
        "",
        "── Per-category summary ─────────────────────────────────────────────",
    ]
    for cat_key, cat in sorted(CATEGORIES.items()):
        n     = counts.get(cat_key, 0)
        flag  = "✓" if n >= MIN_VARIETIES else "⚠ BELOW TARGET"
        lines.append(f"  {cat['display']:<35} {n:>3} images  {flag}")

    lines += [
        "",
        "── Brands per category ──────────────────────────────────────────────",
    ]
    cat_brands: Dict[str, Set[str]] = {}
    for r in all_records:
        cat_brands.setdefault(r.category, set()).add(r.brand)
    for cat_key in sorted(CATEGORIES):
        brands = sorted(cat_brands.get(cat_key, set()))
        if brands:
            lines.append(f"  {CATEGORIES[cat_key]['display']}: {', '.join(brands)}")

    lines += [
        "",
        "── Under-target categories ──────────────────────────────────────────",
    ]
    under = [k for k, v in counts.items() if v < MIN_VARIETIES]
    if under:
        for k in under:
            lines.append(f"  {CATEGORIES[k]['display']}: only {counts[k]} images (target {MIN_VARIETIES})")
    else:
        lines.append("  All categories met the 20-image target.")

    lines += ["", "=" * 70]
    report_text = "\n".join(lines)
    REPORT.write_text(report_text, encoding="utf-8")
    print("\n" + report_text)


# ── Entry point ───────────────────────────────────────────────────────────────

async def main(args: argparse.Namespace):
    t0 = time.time()
    ensure_dirs()
    all_records = load_existing_db()
    counts: Dict[str, int] = {}

    # Pre-populate counts from existing records
    for r in all_records:
        counts[r.category] = counts.get(r.category, 0) + 1
        _seen_urls.add(r.image_url)

    # Filter sites & categories if CLI flags given
    sites_to_run = [
        s for s in SITES
        if s.enabled and (not args.site or s.name.lower() == args.site.lower())
    ]
    cats_to_run = set(CATEGORIES.keys())
    if args.category:
        cats_to_run = {args.category} if args.category in CATEGORIES else cats_to_run

    if not sites_to_run:
        log.error("No matching sites found. Check --site value.")
        sys.exit(1)

    log.info(
        "Starting crawl: %d site(s), %d categor(ies), target %d images/cat",
        len(sites_to_run),
        len(cats_to_run),
        args.limit or MIN_VARIETIES,
    )

    # Set up Playwright browser (shared across all sites)
    browser = None
    pw_ctx  = None
    needs_js = any(s.js_required for s in sites_to_run) and not args.static_only

    connector   = aiohttp.TCPConnector(limit=5)
    img_session = aiohttp.ClientSession(connector=connector, headers=HEADERS)

    try:
        if needs_js and PLAYWRIGHT_AVAILABLE:
            log.info("Launching Playwright (Chromium)…")
            pw_ctx = await async_playwright().__aenter__()
            browser = await pw_ctx.chromium.launch(headless=True)
        elif needs_js and not PLAYWRIGHT_AVAILABLE:
            log.warning(
                "Some sites require JavaScript but Playwright is not installed. "
                "Run:  playwright install chromium   to enable JS rendering. "
                "Falling back to requests for all sites."
            )

        for site in tqdm(sites_to_run, desc="Sites", unit="site"):
            for cat_key in cats_to_run:
                urls = site.category_urls.get(cat_key)
                if not urls:
                    continue
                if counts.get(cat_key, 0) >= (args.limit or MIN_VARIETIES):
                    log.debug("[%s] category already complete, skipping.", cat_key)
                    continue

                try:
                    n = await process_site_category(
                        site         = site,
                        category_key = cat_key,
                        category_urls= urls,
                        all_records  = all_records,
                        counts       = counts,
                        limit        = args.limit,
                        browser      = browser if (site.js_required and not args.static_only) else None,
                        img_session  = img_session,
                    )
                    log.info("[%s][%s] saved %d images", site.name, cat_key, n)
                except Exception as exc:
                    log.error("Site %s / category %s failed: %s", site.name, cat_key, exc)

    finally:
        await img_session.close()
        if browser:
            await browser.close()
        if pw_ctx:
            await pw_ctx.__aexit__(None, None, None)

    save_json(all_records)
    elapsed = time.time() - t0
    write_report(all_records, counts, elapsed)
    log.info("Done. Database saved to %s and %s", DB_CSV, DB_JSON)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Yacht Crew Uniform Image Crawler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--category",    help="Only crawl this category key (e.g. caps)")
    p.add_argument("--site",        help="Only crawl this site name (e.g. Musto)")
    p.add_argument("--static-only", action="store_true",
                   help="Use requests+BS4 only; skip Playwright even for JS sites")
    p.add_argument("--limit",       type=int, default=None,
                   help=f"Max images per category (default: {MIN_VARIETIES})")
    p.add_argument("--verbose",     action="store_true")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.verbose:
        log.setLevel(logging.DEBUG)
    asyncio.run(main(args))
