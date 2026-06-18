import { describe, it, expect } from 'vitest';
import {
  parseProductsFromCatalogText,
  extractJsonLdProducts,
  extractProductsFromHtml,
  extractEshopListingProducts,
  extractProductDetailPrice,
  enrichRecordsWithDetailPrices,
  extractEshopClothingCategoryUrls,
  extractEshopPaginationUrls,
  extractEshopProductDetail,
  isEshopProductUrl,
  eshopCardToRecord,
  extractMagentoListingProducts,
  magentoCardToRecord,
  guessCategory,
  brandFromHostname,
  isSafeFetchUrl,
  isUniformCatalogRecord,
  filterUniformCatalogRecords,
} from './catalogExtract';

describe('isUniformCatalogRecord', () => {
  it('keeps crew garments and accessories', () => {
    expect(isUniformCatalogRecord({ name: 'Logo Crew Cap' })).toBe(true);
    expect(isUniformCatalogRecord({ name: 'Men\'s Quick Dry Polo' })).toBe(true);
    expect(isUniformCatalogRecord({ name: 'Classic Leather Belt' })).toBe(true);
    expect(isUniformCatalogRecord({ name: 'Panel Polyester Cap' })).toBe(true);
  });

  it('drops non-uniform supplier lines', () => {
    const excluded = [
      'Kids Cotton Cap',
      'Bath Towel Bio 150x100cm',
      'Waterproof shoulder bag',
      'Jute beach bag',
      'Panama Hat',
      'Marbella Straw Hat',
      'Cargo Bob Hat',
      'Outback Hat UPF 50+',
      'Storm Umbrella',
      'Satin Scarf',
      'Square Bandana',
      'Men\'s Short Sleeve Rash Guard',
      'Men\'s Swim Shorts',
      'Crocs Shoes',
      'Customization',
      'logo embroidery',
      'Embroidery Text (6.90€)',
      'Add my own logo ?',
      'Item Personalization',
      'Do you want to import your logo?',
    ];
    for (const name of excluded) {
      expect(isUniformCatalogRecord({ name })).toBe(false);
    }
  });
});

describe('filterUniformCatalogRecords', () => {
  it('removes non-uniform rows from mixed lists', () => {
    const rows = [
      { name: 'Deck Polo' },
      { name: 'Kids Cotton Cap' },
      { name: 'Bath Towel Bio 150x100cm' },
    ];
    expect(filterUniformCatalogRecords(rows).map((r) => r.name)).toEqual(['Deck Polo']);
  });
});

describe('parseProductsFromCatalogText', () => {
  it('extracts name and price from catalog lines', () => {
    const text = `
      Technical Crew Polo    €52.00
      Stretch Deck Shorts    EUR 64
      Service Dress — £118
    `;
    const rows = parseProductsFromCatalogText(text, { brand: 'Gill' });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].name).toContain('Technical Crew Polo');
    expect(rows[0].price).toBe(52);
    expect(rows[0].brand).toBe('Gill');
  });

  it('pairs name line with price on next line', () => {
    const text = 'Logo Crew Cap\n€18.00\nNon-Marking Deck Shoe\n89 EUR';
    const rows = parseProductsFromCatalogText(text);
    expect(rows.some((r) => r.name.includes('Logo Crew Cap') && r.price === 18)).toBe(true);
  });
});

describe('extractJsonLdProducts', () => {
  it('reads Product schema blocks', () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"Deck Polo","offers":{"price":"45","priceCurrency":"EUR"},"brand":"Musto"}</script>`;
    const rows = extractJsonLdProducts(html);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Deck Polo');
    expect(rows[0].price).toBe(45);
  });
});

describe('extractProductsFromHtml', () => {
  it('falls back to text extraction', () => {
    const html = '<html><body><p>Softshell Jacket €120</p></body></html>';
    const { records, method } = extractProductsFromHtml(html, 'https://www.musto.com/catalog');
    expect(records.length).toBeGreaterThan(0);
    expect(method).toBe('text');
    expect(records[0].brand).toBe('Musto');
  });

  it('extracts Joomla EShop category grids without on-page prices', () => {
    const html = `
      <html lang="en-gb"><body>
      <div id="products-list-container">
        <div id="product_list">
          <ul>
            <li><div class="uk-panel"><h2>Slam Deck Light Cargo</h2>
              <a href="/clothing/mens/shorts/slam-deck-light-cargo-short" title="Slam Deck Light Cargo">
              <img src="/media/com_eshop/products/resized/test-210x210.JPG" alt="Slam Deck Light Cargo"/></a></div></li>
            <li><div class="uk-panel"><h2>Gill UV Stretch</h2>
              <a href="/clothing/mens/shorts/gill-uv-stretch" title="Gill UV Stretch">
              <img src="/media/com_eshop/products/resized/uv-210x210.JPG" alt="Gill UV Stretch"/></a></div></li>
          </ul>
        </div>
      </div>
      <p>All prices are ex VAT</p>
      </body></html>
    `;
    const { records, method, needsPriceEnrichment } = extractProductsFromHtml(
      html,
      'https://www.thesuperyachtshop.com/clothing/mens/shorts',
    );
    expect(method).toBe('eshop-listing');
    expect(needsPriceEnrichment).toBe(true);
    expect(records).toHaveLength(2);
    expect(records[0].name).toBe('Slam Deck Light Cargo');
    expect(records[0].currency).toBe('GBP');
    expect(records[0].productUrl).toContain('slam-deck-light-cargo-short');
  });
});

describe('extractEshopListingProducts', () => {
  it('parses product cards from listing HTML', () => {
    const cards = extractEshopListingProducts(
      '<div id="product_list"><ul><li><h2>Deck Short</h2><a href="/p/deck"><img src="/img.jpg"/></a></li></ul></div>',
      'https://shop.example.com/cat',
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe('Deck Short');
    expect(cards[0].productUrl).toBe('https://shop.example.com/p/deck');
  });
});

describe('extractProductDetailPrice', () => {
  it('reads price spans with HTML entities', () => {
    const { price, currency } = extractProductDetailPrice('<span class="price">&pound;66.65</span>');
    expect(price).toBe(66.65);
    expect(currency).toBe('GBP');
  });
});

describe('enrichRecordsWithDetailPrices', () => {
  it('fetches detail pages and merges prices', async () => {
    const records = [{
      name: 'Deck Short',
      price: 0,
      currency: 'GBP',
      productUrl: 'https://shop.example.com/p/deck',
    }];
    const fetchHtml = async (url) => {
      expect(url).toBe('https://shop.example.com/p/deck');
      return '<span class="price">£42.00</span>';
    };
    const enriched = await enrichRecordsWithDetailPrices(records, fetchHtml);
    expect(enriched[0].price).toBe(42);
    expect(enriched[0].productUrl).toBe('https://shop.example.com/p/deck');
  });
});

describe('guessCategory', () => {
  it('maps keywords to categories', () => {
    expect(guessCategory('Non-marking deck shoe')).toBe('shoes');
    expect(guessCategory('Chief stew service dress')).toBe('dresses');
  });

  it('classifies dress shirts as shirts, not dresses', () => {
    expect(guessCategory('Ladies Popeline Long Sleeve Dress Shirt RUSSEL')).toBe('shirts');
    expect(guessCategory('Men\'s Long Sleeve Elegance Dress Shirt with Shoulder Tabs')).toBe('shirts');
  });

  it('classifies epaulettes from product title even when details mention galley', () => {
    expect(guessCategory(
      'Silver third chef epaulettes',
      'contributions to the yacht galley operations',
    )).toBe('epaulettes');
    expect(guessCategory('Gold Third Engineer Epaulettes', 'engineering team')).toBe('epaulettes');
  });

  it('classifies polos and t-shirts as tops, not formal shirts', () => {
    expect(guessCategory('B&C Ladies Cotton T-shirt')).toBe('tops');
    expect(guessCategory('Ladies Long Sleeve Polo Shirt Tee Jays')).toBe('tops');
    expect(guessCategory('Men\'s Authentic Sweat-shirt')).toBe('tops');
  });

  it('classifies bermudas and vests correctly', () => {
    expect(guessCategory('Ladies Quick Dry Bermuda')).toBe('bottoms');
    expect(guessCategory('Men\'s Performance Bermuda')).toBe('bottoms');
    expect(guessCategory('Ladies Long Sleeve Puffer Vest')).toBe('outerwear');
    expect(guessCategory('Ladies puffer Vest')).toBe('outerwear');
  });

  it('keeps dresses even when details mention short sleeves', () => {
    expect(guessCategory(
      'Ladies Milano Dress',
      'short sleeves and round neckline',
    )).toBe('dresses');
    expect(guessCategory('Short Sleeve Dress Kariban Premium')).toBe('dresses');
  });

  it('classifies chef trousers as bottoms', () => {
    expect(guessCategory('Unisex Chef Trousers')).toBe('bottoms');
  });

  it('classifies chef shoes as footwear', () => {
    expect(guessCategory('Unisex Chef Non-Slip Moccasin NORDWAYS')).toBe('shoes');
  });

  it('classifies ties and blazers with human logic', () => {
    expect(guessCategory('Clip-on tie')).toBe('accessories');
    expect(guessCategory('Satin Tie')).toBe('accessories');
    expect(guessCategory('Ladies Evening Suit Blazer')).toBe('outerwear');
    expect(guessCategory('Ladies lined windbreaker')).toBe('outerwear');
    expect(guessCategory('Ladies Technical Polyester Polo')).toBe('tops');
  });
});

describe('supplierNameFromUrl', () => {
  it('maps known supplier hosts', async () => {
    const { supplierNameFromUrl } = await import('./catalogExtract');
    expect(supplierNameFromUrl('https://www.marinayachtwear.com/')).toBe('Marina Yacht Wear');
    expect(supplierNameFromUrl('https://www.thesuperyachtshop.com/clothing')).toBe('The Superyacht Shop');
    expect(supplierNameFromUrl('https://www.smallwoods.com/')).toBe("Smallwood's Yachtwear");
  });
});

describe('eshop catalog helpers', () => {
  it('detects product vs category URLs', () => {
    const cats = new Set(['https://www.thesuperyachtshop.com/clothing/mens/polos', 'https://www.thesuperyachtshop.com/clothing/chef']);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/clothing/mens/polos/slam-deck-polo', cats)).toBe(true);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/clothing/chef/varkala-chef-coat-mens', cats)).toBe(true);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/clothing/mens/polos', cats)).toBe(false);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/clothing/brands/gill', cats)).toBe(false);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/accessories/bath-toiletries/guest-slippers', cats)).toBe(true);
    expect(isEshopProductUrl('https://www.thesuperyachtshop.com/accessories/bath-toiletries', cats)).toBe(false);
  });

  it('collects clothing category links from nav HTML', () => {
    const html = `
      <a href="/clothing/mens/polos">Polos</a>
      <a href="/clothing/brands/gill">Gill</a>
      <a href="/clothing/chef">Chef</a>
    `;
    const urls = extractEshopClothingCategoryUrls(html, 'https://www.thesuperyachtshop.com');
    expect(urls).toContain('https://www.thesuperyachtshop.com/clothing/mens/polos');
    expect(urls).toContain('https://www.thesuperyachtshop.com/clothing/chef');
    expect(urls.some((u) => u.includes('/brands/'))).toBe(false);
  });

  it('parses pagination links', () => {
    const urls = extractEshopPaginationUrls(
      '<a href="/clothing/mens/polos/page-2-50">2</a>',
      'https://www.thesuperyachtshop.com/clothing/mens/polos',
    );
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain('page-2-50');
  });

  it('parses EShop product detail pages', () => {
    const html = `
      <h1 class="uk-h3">Slam Tech S/S Polo</h1>
      <span class="price">&pound;45.80</span>
      <img src="/media/com_eshop/manufacturers/SLAM.png" />
      <div id="description">
        <p><strong>FABRIC:</strong> 85% Polyamide, 15% Elastane</p>
        <p><strong>SIZES:</strong> XS-3XL</p>
        <p><strong>COLOURS:</strong> Glacier Grey, Black Ink, Dark Navy</p>
      </div>
      <a class="product-image" href="/media/com_eshop/products/resized/a108006s01_Glacier Grey 1-max-800x800.JPG"></a>
      <img class="uk-align-center" src="/media/com_eshop/products/resized/a108006s01_Glacier Grey 1-max-300x300.JPG" />
    `;
    const detail = extractEshopProductDetail(html, 'https://www.thesuperyachtshop.com/clothing/mens/polos/slam-tech');
    expect(detail.name).toBe('Slam Tech S/S Polo');
    expect(detail.price).toBe(45.8);
    expect(detail.currency).toBe('GBP');
    expect(detail.brand).toBe('SLAM');
    expect(detail.fabric).toContain('polyamide');
    expect(detail.sizeRange).toBe('XS–3XL');
    expect(detail.colours).toEqual(['Glacier Grey', 'Black Ink', 'Dark Navy']);
  });

  it('maps listing cards + detail to uniform records', () => {
    const record = eshopCardToRecord(
      {
        name: 'Slam Deck Polo',
        productUrl: 'https://www.thesuperyachtshop.com/clothing/mens/polos/slam-deck-polo',
        imageUrl: 'https://www.thesuperyachtshop.com/media/polo.jpg',
        categoryPath: '/clothing/mens/polos/slam-deck-polo',
      },
      {
        name: 'Slam Deck Polo',
        brand: 'SLAM',
        price: 42,
        currency: 'GBP',
        colours: ['Navy'],
        swatch: '#0b1f3a',
        imageUrl: 'https://www.thesuperyachtshop.com/media/polo.jpg',
      },
      'https://www.thesuperyachtshop.com',
    );
    expect(record.id).toBe('sys-mens-polos-slam-deck-polo');
    expect(record.fit).toEqual(['man']);
    expect(record.currency).toBe('£');
    expect(record.supplierName).toBe('The Superyacht Shop');
  });
});

describe('magento catalog helpers', () => {
  it('parses Magento listing cards', () => {
    const html = `
      <li class="item product product-item">
        <img data-lazysrc="/media/catalog/product/cache/test.jpg" alt="Men Horizon Short" />
        <span data-price-amount="70"></span>
        <a class="product-item-link" href="/mens-horizon-shorts.html">Men&#039;s Horizon Short</a>
      </li>
    `;
    const cards = extractMagentoListingProducts(html, 'https://www.smallwoods.com/industries/yachtwear');
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("Men's Horizon Short");
    expect(cards[0].price).toBe(70);
    expect(cards[0].productUrl).toContain('mens-horizon-shorts.html');
  });

  it('maps Magento cards + detail to uniform records', () => {
    const record = magentoCardToRecord(
      {
        name: "Men's Horizon Short",
        productUrl: 'https://www.smallwoods.com/mens-horizon-shorts.html',
        imageUrl: 'https://www.smallwoods.com/media/test.jpg',
        price: 70,
      },
      {
        name: "Men's Horizon Short",
        brand: "Smallwood's",
        price: 70,
        currency: 'USD',
        colours: ['Black', 'Navy'],
        swatch: '#111827',
        imageUrl: 'https://www.smallwoods.com/media/test.jpg',
        sizeRange: '30–44',
      },
      'https://www.smallwoods.com',
    );
    expect(record.id).toBe('sw-mens-horizon-shorts');
    expect(record.fit).toEqual(['man']);
    expect(record.currency).toBe('$');
    expect(record.supplierName).toBe("Smallwood's Yachtwear");
  });
});

describe('brandFromHostname', () => {
  it('derives brand from URL', () => {
    expect(brandFromHostname('https://www.gillmarine.com/polos')).toBe('Gillmarine');
  });
});

describe('isSafeFetchUrl', () => {
  it('allows public https URLs', () => {
    expect(isSafeFetchUrl('https://supplier.example/catalog')).toBe(true);
  });
  it('blocks localhost', () => {
    expect(isSafeFetchUrl('http://localhost:3000')).toBe(false);
  });
});

describe('fetchAllShopifyProducts', () => {
  it('paginates until an empty page', async () => {
    const { fetchAllShopifyProducts } = await import('./catalogExtract');
    const calls = [];
    const fetchJson = async (url) => {
      calls.push(url);
      if (url.includes('page=1')) return { products: [{ title: 'A', variants: [{ price: '1' }], handle: 'a' }] };
      return { products: [] };
    };
    const products = await fetchAllShopifyProducts('https://shop.example.com', fetchJson, { pageSize: 50 });
    expect(products).toHaveLength(1);
    expect(calls[0]).toContain('limit=50');
  });
});

describe('shopifyProductToRecord', () => {
  it('maps Shopify product JSON to catalog rows', async () => {
    const { shopifyProductToRecord } = await import('./catalogExtract');
    const row = shopifyProductToRecord({
      title: 'B&C Ladies Cotton T-shirt',
      vendor: 'B&C',
      handle: 'b-c-ladies-cotton-t-shirt',
      body_html: '<p><strong>Material:</strong> 100% cotton jersey</p>',
      product_type: 'Resell',
      options: [
        { name: 'Couleur', values: ['White', 'Navy'] },
        { name: 'Taille', values: ['XS', 'S', 'M', 'L', 'XL'] },
      ],
      variants: [
        { id: 1, option1: 'White', option2: 'S', price: '8.50', title: 'White / S' },
        { id: 2, option1: 'Navy', option2: 'S', price: '8.50', title: 'Navy / S' },
      ],
      images: [
        { src: 'https://cdn.example.com/lifestyle.png', variant_ids: [] },
        { src: 'https://cdn.example.com/white-shirt.png', variant_ids: [1] },
        { src: 'https://cdn.example.com/navy-shirt.png', variant_ids: [2] },
      ],
    }, 'Marina Yacht Wear', 'https://www.marinayachtwear.com');
    expect(row.name).toBe('B&C Ladies Cotton T-shirt');
    expect(row.brand).toBe('B&C');
    expect(row.supplierName).toBe('Marina Yacht Wear');
    expect(row.productUrl).toBe('https://www.marinayachtwear.com/products/b-c-ladies-cotton-t-shirt');
    expect(row.price).toBe(8.5);
    expect(row.currency).toBe('EUR');
    expect(row.colours).toBe('White|Navy');
    expect(row.sizeRange).toBe('XS–XL');
    expect(row.fabric).toBe('100% cotton jersey');
    expect(row.imageUrl).toContain('white-shirt.png');
    expect(row.colourImages).toContain('white-shirt.png');
    expect(row.colourImages).toContain('navy-shirt.png');
    expect(row.fit).toBe('woman');
  });
});

describe('extractShopifyCatalog collections', () => {
  it('loads products from a Shopify collection URL', async () => {
    const fetchJson = async (url) => {
      if (!url.includes('/collections/ladies-yacht-crew-pants/products.json')) {
        throw new Error(`unexpected url ${url}`);
      }
      return {
        products: [
          { title: 'Ladies Chino Pant', handle: 'ladies-chino-pant', vendor: 'Kariban', variants: [{ price: '49.00', option1: 'Navy' }], options: [{ name: 'Color', values: ['Navy'] }], images: [{ src: 'https://cdn.shopify.com/chino.jpg' }], body_html: '<p>98% cotton twill</p>' },
          { title: 'Ladies Performance Pant', handle: 'ladies-performance-pant', vendor: 'Marina Yacht Wear', variants: [{ price: '75.00', option1: 'Navy' }], options: [{ name: 'Color', values: ['Navy'] }], images: [{ src: 'https://cdn.shopify.com/performance.jpg' }], body_html: '<p>Performance pant</p>' },
        ],
      };
    };

    const { extractShopifyCatalog, parseShopifyCollectionHandle } = await import('./catalogExtract.js');
    expect(parseShopifyCollectionHandle('https://www.marinayachtwear.com/collections/ladies-yacht-crew-pants')).toBe('ladies-yacht-crew-pants');

    const { records, method } = await extractShopifyCatalog(
      'https://www.marinayachtwear.com/collections/ladies-yacht-crew-pants',
      fetchJson,
    );
    expect(method).toBe('shopify-collection-json');
    expect(records.map((r) => r.name)).toEqual(['Ladies Chino Pant', 'Ladies Performance Pant']);
  });
});
