"""
Configuration: categories, target sites, and CSS selectors.
Selectors follow each site's actual HTML structure — update them if a site
redesigns. Set enabled=False to skip a site without removing its config.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional

# ── Root output folder ────────────────────────────────────────────────────────
IMAGES_ROOT = "IMAGES"

# ── Crawler behaviour ─────────────────────────────────────────────────────────
MIN_VARIETIES   = 20        # target images per category
REQUEST_DELAY   = 2.0       # seconds between HTTP requests
MAX_RETRIES     = 3
MIN_IMG_W       = 300       # minimum image width in pixels
MIN_IMG_H       = 300       # minimum image height in pixels
MAX_PAGES       = 10        # max pagination pages per category URL
TIMEOUT         = 20        # HTTP timeout seconds

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

# ── Category definitions ──────────────────────────────────────────────────────
# Each key becomes the subfolder name under IMAGES/.
CATEGORIES: Dict[str, Dict] = {
    "caps": {
        "display": "Caps",
        "keywords": ["cap", "caps", "baseball cap", "sailing cap", "crew cap", "sun cap"],
    },
    "guest-on-polos": {
        "display": "Guest On Polos",
        "keywords": ["polo shirt", "polo", "pique polo", "guest polo", "formal polo"],
    },
    "guest-off-t-shirts": {
        "display": "Guest Off T-Shirts",
        "keywords": ["t-shirt", "tee shirt", "crew t-shirt", "casual tee", "short sleeve top"],
    },
    "guest-on-evening-dresses": {
        "display": "Guest On Evening Dresses",
        "keywords": ["dress", "evening dress", "crew dress", "formal dress", "maxi dress"],
    },
    "sunglasses": {
        "display": "Sunglasses",
        "keywords": [
            "sunglasses", "polarised sunglasses", "polarized sunglasses",
            "sailing sunglasses", "marine sunglasses", "sport sunglasses",
        ],
    },
    "shirts-with-epaulettes": {
        "display": "Shirts with Epaulettes",
        "keywords": [
            "epaulette shirt", "epaulettes shirt", "officer shirt",
            "rank shirt", "nautical shirt", "yacht officer", "captain shirt",
        ],
    },
    "chef-shoes": {
        "display": "Chef Shoes",
        "keywords": [
            "chef shoes", "kitchen shoes", "non-slip shoes", "galley shoes",
            "chef clogs", "safety kitchen shoes",
        ],
    },
    "engineering-overalls": {
        "display": "Engineering Overalls",
        "keywords": [
            "overalls", "boiler suit", "coveralls", "engineering overalls",
            "marine overalls", "yacht overalls", "workwear coverall",
        ],
    },
    "skorts": {
        "display": "Skorts",
        "keywords": ["skort", "skorts", "tennis skort", "sport skort", "sailing skort"],
    },
    "mens-shoes": {
        "display": "Men's Shoes",
        "keywords": [
            "men's shoes", "mens shoes", "men's trainers", "men's loafer",
            "men's sneaker", "men casual shoes",
        ],
    },
    "ladies-shoes": {
        "display": "Ladies' Shoes",
        "keywords": [
            "ladies shoes", "women's shoes", "womens shoes", "ladies flats",
            "women's loafer", "women's trainer",
        ],
    },
    "mens-polos": {
        "display": "Men's Polos",
        "keywords": ["men's polo", "mens polo", "polo shirt men", "male polo"],
    },
    "ladies-polos": {
        "display": "Ladies' Polos",
        "keywords": ["ladies polo", "women's polo", "womens polo", "polo shirt women", "female polo"],
    },
    "shorts": {
        "display": "Shorts",
        "keywords": [
            "shorts", "crew shorts", "deck shorts", "sailing shorts",
            "chino shorts", "board shorts",
        ],
    },
    "trousers": {
        "display": "Trousers",
        "keywords": [
            "trousers", "chinos", "crew trousers", "deck trousers",
            "sailing trousers", "smart trousers",
        ],
    },
    "belts": {
        "display": "Belts",
        "keywords": ["belt", "belts", "nautical belt", "canvas belt", "leather belt", "sailing belt"],
    },
    "jackets": {
        "display": "Jackets",
        "keywords": [
            "jacket", "softshell jacket", "windbreaker", "crew jacket",
            "sailing jacket", "midlayer jacket",
        ],
    },
    "fleeces": {
        "display": "Fleeces",
        "keywords": ["fleece", "fleece jacket", "mid-layer fleece", "crew fleece", "sailing fleece"],
    },
    "aprons": {
        "display": "Aprons",
        "keywords": [
            "apron", "chef apron", "galley apron", "bib apron",
            "kitchen apron", "waist apron",
        ],
    },
    "deck-shoes": {
        "display": "Deck Shoes",
        "keywords": [
            "deck shoe", "boat shoe", "sailing shoe", "yachting shoe",
            "non-marking sole shoe", "marine shoe",
        ],
    },
    "rainwear": {
        "display": "Rainwear",
        "keywords": [
            "rainwear", "waterproof jacket", "rain jacket", "foul weather gear",
            "oilskin", "offshore jacket", "sailing waterproof",
        ],
    },
    "swimwear": {
        "display": "Swimwear",
        "keywords": [
            "swimwear", "swim shorts", "board shorts", "bikini", "swimsuit",
            "trunks", "bathing suit", "nautical swimwear",
        ],
    },
    "chef-jackets": {
        "display": "Chef Jackets",
        "keywords": [
            "chef jacket", "chef coat", "chef whites", "kitchen jacket",
            "chef tunic", "galley jacket",
        ],
    },
    "formal-shirts": {
        "display": "Formal Shirts",
        "keywords": [
            "formal shirt", "dress shirt", "white shirt", "officer formal shirt",
            "uniform shirt", "yacht formal",
        ],
    },
    "rash-vests": {
        "display": "Rash Vests",
        "keywords": [
            "rash vest", "rash guard", "sun shirt", "UV shirt",
            "lycra vest", "SPF shirt",
        ],
    },
}

# ── Site configuration ────────────────────────────────────────────────────────

@dataclass
class SiteConfig:
    name: str
    base_url: str
    # Maps CATEGORIES key -> list of category page URLs on this site
    category_urls: Dict[str, List[str]]
    # CSS selectors for product list pages
    product_card_sel: str          = "article, li.product, .product-item, .grid-item"
    product_link_sel: str          = "a"
    # CSS selectors on individual product pages
    product_name_sel: str          = "h1"
    price_sel: str                 = ".price, [class*='price']"
    colour_sel: str                = ""   # leave blank if not reliably available
    image_sel: str                 = ".product-image img, .woocommerce-product-gallery img, img.featured-image"
    image_attr: str                = "src"    # or "data-src" for lazy-loaded
    next_page_sel: str             = "a.next, .pagination a[rel='next'], a[aria-label='Next']"
    enabled: bool                  = True
    js_required: bool              = False   # True → use Playwright
    rate_limit: float              = 2.0
    notes: str                     = ""


SITES: List[SiteConfig] = [

    # ── Liquid Yacht Wear ────────────────────────────────────────────────────
    SiteConfig(
        name         = "Liquid Yacht Wear",
        base_url     = "https://www.liquidyachtwear.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "mens-polos":          ["https://www.liquidyachtwear.com/collections/mens-polo-shirts"],
            "ladies-polos":        ["https://www.liquidyachtwear.com/collections/womens-polo-shirts"],
            "guest-on-polos":      ["https://www.liquidyachtwear.com/collections/polo-shirts"],
            "caps":                ["https://www.liquidyachtwear.com/collections/caps"],
            "skorts":              ["https://www.liquidyachtwear.com/collections/skorts"],
            "shorts":              ["https://www.liquidyachtwear.com/collections/shorts"],
            "trousers":            ["https://www.liquidyachtwear.com/collections/trousers"],
            "jackets":             ["https://www.liquidyachtwear.com/collections/jackets"],
            "fleeces":             ["https://www.liquidyachtwear.com/collections/fleeces"],
            "guest-off-t-shirts":  ["https://www.liquidyachtwear.com/collections/t-shirts"],
            "guest-on-evening-dresses": ["https://www.liquidyachtwear.com/collections/dresses"],
            "swimwear":            ["https://www.liquidyachtwear.com/collections/swimwear"],
            "rainwear":            ["https://www.liquidyachtwear.com/collections/waterproofs"],
            "formal-shirts":       ["https://www.liquidyachtwear.com/collections/shirts"],
        },
        product_card_sel  = "li.grid__item",
        product_link_sel  = "a.full-unstyled-link",
        product_name_sel  = "h1.product__title",
        price_sel         = ".price__regular .price-item--regular",
        colour_sel        = ".product__variant-label",
        image_sel         = ".product__media img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Shopify storefront",
    ),

    # ── Crew Gear ────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Crew Gear",
        base_url     = "https://www.crewgear.co.uk",
        js_required  = False,
        rate_limit   = 2.0,
        category_urls = {
            "mens-polos":          ["https://www.crewgear.co.uk/product-category/polo-shirts/"],
            "ladies-polos":        ["https://www.crewgear.co.uk/product-category/polo-shirts/ladies/"],
            "guest-off-t-shirts":  ["https://www.crewgear.co.uk/product-category/t-shirts/"],
            "caps":                ["https://www.crewgear.co.uk/product-category/headwear/"],
            "shorts":              ["https://www.crewgear.co.uk/product-category/shorts/"],
            "trousers":            ["https://www.crewgear.co.uk/product-category/trousers/"],
            "jackets":             ["https://www.crewgear.co.uk/product-category/jackets/"],
            "fleeces":             ["https://www.crewgear.co.uk/product-category/fleeces/"],
            "swimwear":            ["https://www.crewgear.co.uk/product-category/swimwear/"],
            "rash-vests":          ["https://www.crewgear.co.uk/product-category/rash-vests/"],
            "belts":               ["https://www.crewgear.co.uk/product-category/accessories/belts/"],
        },
        product_card_sel  = "li.product",
        product_link_sel  = "a.woocommerce-loop-product__link",
        product_name_sel  = "h1.product_title",
        price_sel         = ".woocommerce-Price-amount",
        colour_sel        = ".variations select#pa_colour option:checked",
        image_sel         = ".woocommerce-product-gallery__image img",
        image_attr        = "src",
        next_page_sel     = "a.next.page-numbers",
        notes             = "WooCommerce",
    ),

    # ── Yacht Uniform ────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Yacht Uniform",
        base_url     = "https://www.yachtuniform.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "mens-polos":                ["https://www.yachtuniform.com/collections/mens-polo"],
            "ladies-polos":              ["https://www.yachtuniform.com/collections/womens-polo"],
            "shirts-with-epaulettes":    ["https://www.yachtuniform.com/collections/epaulette-shirts"],
            "caps":                      ["https://www.yachtuniform.com/collections/caps"],
            "skorts":                    ["https://www.yachtuniform.com/collections/skorts"],
            "shorts":                    ["https://www.yachtuniform.com/collections/shorts"],
            "trousers":                  ["https://www.yachtuniform.com/collections/trousers"],
            "guest-on-evening-dresses":  ["https://www.yachtuniform.com/collections/dresses"],
            "jackets":                   ["https://www.yachtuniform.com/collections/jackets"],
            "formal-shirts":             ["https://www.yachtuniform.com/collections/shirts"],
        },
        product_card_sel  = "li.grid__item",
        product_link_sel  = "a.product-item__image-wrapper",
        product_name_sel  = "h1.product__title",
        price_sel         = ".price__regular .price-item",
        colour_sel        = ".swatch__value",
        image_sel         = ".product__media img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Shopify storefront",
    ),

    # ── Musto ────────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Musto",
        base_url     = "https://www.musto.com",
        js_required  = True,
        rate_limit   = 3.0,
        category_urls = {
            "deck-shoes":  ["https://www.musto.com/collections/footwear"],
            "jackets":     ["https://www.musto.com/collections/jackets"],
            "rainwear":    ["https://www.musto.com/collections/waterproofs"],
            "fleeces":     ["https://www.musto.com/collections/mid-layers"],
            "mens-polos":  ["https://www.musto.com/collections/mens-polo-shirts"],
            "ladies-polos":["https://www.musto.com/collections/womens-polo-shirts"],
            "rash-vests":  ["https://www.musto.com/collections/rash-vests"],
            "swimwear":    ["https://www.musto.com/collections/swimwear"],
            "caps":        ["https://www.musto.com/collections/hats"],
            "shorts":      ["https://www.musto.com/collections/shorts"],
            "trousers":    ["https://www.musto.com/collections/trousers"],
        },
        product_card_sel  = "li.product-grid-item",
        product_link_sel  = "a.product-grid-item__link",
        product_name_sel  = "h1.product-detail__title",
        price_sel         = ".product-detail__price",
        colour_sel        = ".colour-selector__label",
        image_sel         = ".product-detail__image img",
        image_attr        = "src",
        next_page_sel     = "a.pagination__next",
        notes             = "Major sailing brand",
    ),

    # ── Gill Marine ─────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Gill",
        base_url     = "https://www.gillmarine.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "deck-shoes":  ["https://www.gillmarine.com/en-gb/footwear/"],
            "jackets":     ["https://www.gillmarine.com/en-gb/jackets/"],
            "rainwear":    ["https://www.gillmarine.com/en-gb/waterproofs/"],
            "fleeces":     ["https://www.gillmarine.com/en-gb/mid-layers/"],
            "mens-polos":  ["https://www.gillmarine.com/en-gb/polo-shirts/"],
            "shorts":      ["https://www.gillmarine.com/en-gb/shorts/"],
            "trousers":    ["https://www.gillmarine.com/en-gb/trousers/"],
            "rash-vests":  ["https://www.gillmarine.com/en-gb/rash-vests/"],
            "caps":        ["https://www.gillmarine.com/en-gb/headwear/"],
            "swimwear":    ["https://www.gillmarine.com/en-gb/swimwear/"],
        },
        product_card_sel  = ".product-tile",
        product_link_sel  = "a.product-tile__link",
        product_name_sel  = "h1.product-title",
        price_sel         = ".price__current",
        colour_sel        = ".colour-name",
        image_sel         = ".product-gallery__image img",
        image_attr        = "src",
        next_page_sel     = "a.pagination-next",
        notes             = "Gill Marine UK sailing brand",
    ),

    # ── Dubarry ──────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Dubarry",
        base_url     = "https://www.dubarry.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "deck-shoes": [
                "https://www.dubarry.com/en-gb/collections/sailing-boots",
                "https://www.dubarry.com/en-gb/collections/deck-shoes",
            ],
            "mens-shoes":   ["https://www.dubarry.com/en-gb/collections/mens-shoes"],
            "ladies-shoes": ["https://www.dubarry.com/en-gb/collections/womens-shoes"],
            "jackets":      ["https://www.dubarry.com/en-gb/collections/sailing-jackets"],
            "belts":        ["https://www.dubarry.com/en-gb/collections/belts"],
        },
        product_card_sel  = "li.grid__item",
        product_link_sel  = "a.product-item__image-wrapper",
        product_name_sel  = "h1.product__title",
        price_sel         = ".price__regular .price-item",
        colour_sel        = ".color-swatch__label",
        image_sel         = ".product__media img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Sailing boots & deck shoes specialist",
    ),

    # ── Slam ─────────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Slam",
        base_url     = "https://www.slam.it",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "deck-shoes":  ["https://www.slam.it/en/footwear/"],
            "jackets":     ["https://www.slam.it/en/jackets/"],
            "rainwear":    ["https://www.slam.it/en/offshore/"],
            "mens-polos":  ["https://www.slam.it/en/polo/"],
            "shorts":      ["https://www.slam.it/en/shorts/"],
            "trousers":    ["https://www.slam.it/en/trousers/"],
            "swimwear":    ["https://www.slam.it/en/swimwear/"],
            "caps":        ["https://www.slam.it/en/headwear/"],
            "rash-vests":  ["https://www.slam.it/en/sun-protection/"],
        },
        product_card_sel  = ".product-item",
        product_link_sel  = "a.product-item__link",
        product_name_sel  = "h1.product-name",
        price_sel         = ".price-box .price",
        colour_sel        = ".color-label",
        image_sel         = ".product-image-container img",
        image_attr        = "src",
        next_page_sel     = "a.next-page",
        notes             = "Italian marine sportswear",
    ),

    # ── Helly Hansen (Marine / Workwear) ─────────────────────────────────────
    SiteConfig(
        name         = "Helly Hansen",
        base_url     = "https://www.hellyhansen.com",
        js_required  = True,
        rate_limit   = 3.0,
        category_urls = {
            "engineering-overalls": [
                "https://www.hellyhansen.com/en_gb/workwear/coveralls",
            ],
            "jackets":   ["https://www.hellyhansen.com/en_gb/sailing/jackets"],
            "rainwear":  ["https://www.hellyhansen.com/en_gb/sailing/waterproofs"],
            "fleeces":   ["https://www.hellyhansen.com/en_gb/sailing/mid-layers"],
            "mens-polos":["https://www.hellyhansen.com/en_gb/men/polo-shirts"],
            "shorts":    ["https://www.hellyhansen.com/en_gb/sailing/shorts"],
            "trousers":  ["https://www.hellyhansen.com/en_gb/sailing/trousers"],
            "caps":      ["https://www.hellyhansen.com/en_gb/accessories/headwear"],
            "aprons":    ["https://www.hellyhansen.com/en_gb/workwear/aprons"],
        },
        product_card_sel  = ".product-tile",
        product_link_sel  = "a.product-tile__link",
        product_name_sel  = "h1.product__name",
        price_sel         = ".product__price",
        colour_sel        = ".color-selector__label",
        image_sel         = ".product__media-img img",
        image_attr        = "src",
        next_page_sel     = "a.pagination__next",
        notes             = "Workwear + sailing ranges",
    ),

    # ── Sebago ───────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Sebago",
        base_url     = "https://www.sebago.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "deck-shoes":  ["https://www.sebago.com/en-gb/collections/boat-shoes"],
            "mens-shoes":  ["https://www.sebago.com/en-gb/collections/mens-shoes"],
            "ladies-shoes":["https://www.sebago.com/en-gb/collections/womens-shoes"],
            "belts":       ["https://www.sebago.com/en-gb/collections/belts"],
        },
        product_card_sel  = "li.grid__item",
        product_link_sel  = "a.product-item__image-wrapper",
        product_name_sel  = "h1.product__title",
        price_sel         = ".price__regular .price-item",
        colour_sel        = ".color-swatch__label",
        image_sel         = ".product__media img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Classic boat shoe brand",
    ),

    # ── Sperry ───────────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Sperry",
        base_url     = "https://www.sperry.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "deck-shoes":  ["https://www.sperry.com/en-gb/boat-shoes/"],
            "mens-shoes":  ["https://www.sperry.com/en-gb/mens/shoes/"],
            "ladies-shoes":["https://www.sperry.com/en-gb/womens/shoes/"],
        },
        product_card_sel  = ".product-tile",
        product_link_sel  = "a.thumb-link",
        product_name_sel  = "h1.product-name",
        price_sel         = ".product-price",
        colour_sel        = ".color-attribute span",
        image_sel         = ".product-image img",
        image_attr        = "src",
        next_page_sel     = "a.page-next",
        notes             = "Classic American boat shoe brand",
    ),

    # ── Marinestore / Andark ─────────────────────────────────────────────────
    SiteConfig(
        name         = "Marinestore",
        base_url     = "https://www.marinestore.co.uk",
        js_required  = False,
        rate_limit   = 2.0,
        category_urls = {
            "deck-shoes": ["https://www.marinestore.co.uk/Footwear/Deck-Shoes"],
            "jackets":    ["https://www.marinestore.co.uk/Clothing/Jackets"],
            "fleeces":    ["https://www.marinestore.co.uk/Clothing/Fleeces"],
            "caps":       ["https://www.marinestore.co.uk/Clothing/Hats"],
        },
        product_card_sel  = ".product-listing__item",
        product_link_sel  = "a.product-listing__link",
        product_name_sel  = "h1.product-detail__title",
        price_sel         = ".price-display",
        colour_sel        = ".colour-option.selected",
        image_sel         = ".product-image img",
        image_attr        = "src",
        next_page_sel     = "a.next-page",
        notes             = "UK marine chandlery",
    ),

    # ── Chef Works ───────────────────────────────────────────────────────────
    SiteConfig(
        name         = "Chef Works",
        base_url     = "https://www.chefworks.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "chef-jackets":  ["https://www.chefworks.com/chef-coats"],
            "chef-shoes":    ["https://www.chefworks.com/footwear"],
            "aprons":        ["https://www.chefworks.com/aprons"],
            "engineering-overalls": ["https://www.chefworks.com/pants-trousers"],
        },
        product_card_sel  = ".product-item",
        product_link_sel  = "a.product-item-photo",
        product_name_sel  = "h1.page-title",
        price_sel         = ".price-wrapper .price",
        colour_sel        = ".swatch-attribute-selected-option",
        image_sel         = ".product.media img",
        image_attr        = "src",
        next_page_sel     = "a.action.next",
        notes             = "Professional chef workwear",
    ),

    # ── Nisbets (Catering supplies - chef items) ──────────────────────────────
    SiteConfig(
        name         = "Nisbets",
        base_url     = "https://www.nisbets.co.uk",
        js_required  = False,
        rate_limit   = 2.0,
        category_urls = {
            "chef-jackets": [
                "https://www.nisbets.co.uk/clothing/chef-jackets/_/A544",
            ],
            "chef-shoes": [
                "https://www.nisbets.co.uk/clothing/shoes-and-boots/_/A547",
            ],
            "aprons": [
                "https://www.nisbets.co.uk/clothing/aprons/_/A546",
            ],
        },
        product_card_sel  = ".product-listing-item",
        product_link_sel  = "a.product-listing-name",
        product_name_sel  = "h1.product-title",
        price_sel         = ".selling-price-value",
        colour_sel        = "",
        image_sel         = ".product-main-image img",
        image_attr        = "src",
        next_page_sel     = "a.next",
        notes             = "UK catering supplier",
    ),

    # ── Oakley (Sunglasses) ───────────────────────────────────────────────────
    SiteConfig(
        name         = "Oakley",
        base_url     = "https://www.oakley.com",
        js_required  = True,
        rate_limit   = 3.0,
        category_urls = {
            "sunglasses": [
                "https://www.oakley.com/en-gb/category/sunglasses/sport",
                "https://www.oakley.com/en-gb/category/sunglasses/polarized",
            ],
        },
        product_card_sel  = ".rc-product-card",
        product_link_sel  = "a.rc-product-card__link",
        product_name_sel  = "h1.rc-product__name",
        price_sel         = ".rc-price__value",
        colour_sel        = ".rc-color__label",
        image_sel         = ".rc-product-images__img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Sports / marine sunglasses",
    ),

    # ── Maui Jim (Marine Sunglasses) ──────────────────────────────────────────
    SiteConfig(
        name         = "Maui Jim",
        base_url     = "https://www.mauijim.com",
        js_required  = True,
        rate_limit   = 2.5,
        category_urls = {
            "sunglasses": [
                "https://www.mauijim.com/en_GB/sunglasses",
                "https://www.mauijim.com/en_GB/sport-sunglasses",
            ],
        },
        product_card_sel  = ".product-tile",
        product_link_sel  = "a.product-tile__link",
        product_name_sel  = "h1.product-name",
        price_sel         = ".product-price",
        colour_sel        = ".color-label",
        image_sel         = ".product-image-container img",
        image_attr        = "src",
        next_page_sel     = "a.page-next",
        notes             = "Premium marine / outdoor sunglasses",
    ),

    # ── Blocking Gear (superyacht uniforms) ───────────────────────────────────
    SiteConfig(
        name         = "Blocking Gear",
        base_url     = "https://www.blockinggear.com",
        js_required  = False,
        rate_limit   = 2.0,
        category_urls = {
            "shirts-with-epaulettes":  ["https://www.blockinggear.com/collections/shirts"],
            "mens-polos":              ["https://www.blockinggear.com/collections/polos"],
            "ladies-polos":            ["https://www.blockinggear.com/collections/ladies-polos"],
            "caps":                    ["https://www.blockinggear.com/collections/caps"],
        },
        product_card_sel  = "li.grid__item",
        product_link_sel  = "a.product-item__image-wrapper",
        product_name_sel  = "h1.product__title",
        price_sel         = ".price__regular .price-item",
        colour_sel        = ".product__variant-label",
        image_sel         = ".product__media img",
        image_attr        = "src",
        next_page_sel     = "a[aria-label='Next page']",
        notes             = "Superyacht uniform supplier",
    ),

]
