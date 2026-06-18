/**
 * Supplier registry for catalog import scripts.
 * platform: shopify | magento | eshop | woocommerce-store | woocommerce-sitemap | sea-design | waypoint | manual
 */

/** Suppliers with live scraped catalog files bundled into defaultProducts. */
export const IMPORTED_SUPPLIER_IDS = [
  'wave-uniforms',
  'superyacht-shop',
  'dubarry',
  'gill',
  'pinmar-yacht-supply',
  'azurtex',
  'liquid-yacht-wear',
  'marina-yacht-wear',
  'coco-kandy',
  'sea-design',
  'smallwoods',
  'waypoint-uae',
  'oceanr',
];

export const SUPPLIER_SOURCES = [
  {
    id: 'liquid-yacht-wear',
    name: 'Liquid Yacht Wear',
    url: 'https://www.liquidyachtwear.com/',
    platform: 'woocommerce-store',
    exportKey: 'liquidYachtWearProducts',
    file: 'liquidYachtWearCatalog.js',
  },
  {
    id: 'smallwoods',
    name: "Smallwood's Yachtwear",
    url: 'https://www.smallwoods.com/',
    platform: 'magento',
    exportKey: 'smallwoodsProducts',
    file: 'smallwoodsCatalog.js',
  },
  {
    id: 'marina-yacht-wear',
    name: 'Marina Yacht Wear',
    url: 'https://www.marinayachtwear.com/',
    platform: 'shopify',
    exportKey: 'marinaProducts',
    file: 'marinaCatalog.js',
    skipFetch: true,
  },
  {
    id: 'crew-a-la-mode',
    name: 'Crew à la Mode',
    url: 'https://crewalamode.com/',
    platform: 'woocommerce-sitemap',
    exportKey: 'crewALaModeProducts',
    file: 'crewALaModeCatalog.js',
    sitemapPaths: ['/wp-sitemap-posts-product-1.xml', '/sitemap.xml'],
  },
  {
    id: 'sea-design',
    name: 'Sea Design',
    url: 'https://sea-design.com/',
    platform: 'sea-design',
    exportKey: 'seaDesignProducts',
    file: 'seaDesignCatalog.js',
  },
  {
    id: 'dwd-uniform',
    name: 'DWD Uniform Solutions',
    url: 'https://www.dolphinwear.com/',
    platform: 'manual',
    exportKey: 'dwdUniformProducts',
    file: 'dwdUniformCatalog.js',
    notes: 'Site blocks automated fetch (HTTP 436); catalogue is enquiry-only online.',
  },
  {
    id: 'nauticrew',
    name: 'Nauticrew Yacht Wear',
    url: 'https://www.nauticrewyachtwear.com/',
    platform: 'manual',
    exportKey: 'nauticrewProducts',
    file: 'nauticrewCatalog.js',
    notes: 'Site returns HTTP 403 to automated fetch.',
  },
  {
    id: 'coco-kandy',
    name: 'Coco & Kandy Crew',
    url: 'https://cocoandkandy.com/',
    platform: 'shopify',
    exportKey: 'cocoKandyProducts',
    file: 'cocoKandyCatalog.js',
  },
  {
    id: 'superyacht-shop',
    name: 'The Superyacht Shop',
    url: 'https://www.thesuperyachtshop.com/',
    platform: 'eshop',
    exportKey: 'superyachtProducts',
    file: 'superyachtCatalog.js',
    skipFetch: true,
  },
  {
    id: 'taylor-made-designs',
    name: 'Taylor Made Designs',
    url: 'https://www.taylormadedesigns.co.uk/',
    platform: 'woocommerce-sitemap',
    exportKey: 'taylorMadeDesignsProducts',
    file: 'taylorMadeDesignsCatalog.js',
    sitemapPaths: ['/product-sitemap.xml', '/sitemap_index.xml'],
  },
  {
    id: 'azurtex',
    name: 'Azurtex',
    url: 'https://www.azurtex.com/',
    platform: 'woocommerce-sitemap',
    exportKey: 'azurtexProducts',
    file: 'azurtexCatalog.js',
    sitemapPaths: ['/product-sitemap.xml'],
  },
  {
    id: 'oceanform',
    name: 'Oceanform',
    url: 'https://ocean-form.com/',
    platform: 'manual',
    exportKey: 'oceanformProducts',
    file: 'oceanformCatalog.js',
    notes: 'Brochure / enquiry site without a public product catalogue.',
  },
  {
    id: 'ethical-yacht-wear',
    name: 'Ethical Yacht Wear',
    url: 'https://ethicalyachtwear.com/',
    platform: 'woocommerce-sitemap',
    exportKey: 'ethicalYachtWearProducts',
    file: 'ethicalYachtWearCatalog.js',
    sitemapPaths: ['/wp-sitemap-posts-product-1.xml', '/sitemap.xml'],
  },
  {
    id: 'all-around-the-yacht',
    name: 'All Around The Yacht',
    url: 'https://www.allaroundtheyacht.com/',
    platform: 'manual',
    exportKey: 'allAroundTheYachtProducts',
    file: 'allAroundTheYachtCatalog.js',
    notes: 'No public online shop; uniforms supplied via enquiry.',
  },
  {
    id: 'oceanr',
    name: 'OceanR',
    url: 'https://oceanr.co/',
    platform: 'woocommerce-store',
    exportKey: 'oceanrProducts',
    file: 'oceanrCatalog.js',
  },
  {
    id: 'mallorca-clothing',
    name: 'Mallorca Clothing Company',
    url: 'https://mallorcaclothing.sowebshop.com/ie/',
    platform: 'magento',
    exportKey: 'mallorcaClothingProducts',
    file: 'mallorcaClothingCatalog.js',
    categoryPaths: [
      '/ie/catalog/category/view/id/10874',
      '/ie/sowebshop/homme-224.html',
      '/ie/sowebshop/femme-224.html',
      '/ie/catalog/category/view/id/3389',
      '/ie/catalog/category/view/id/3335',
    ],
  },
  {
    id: 'superyacht-uniform',
    name: 'Superyacht Uniform',
    url: 'https://www.superyachtuniforms.com/',
    platform: 'woocommerce-sitemap',
    exportKey: 'superyachtUniformProducts',
    file: 'superyachtUniformCatalog.js',
    sitemapPaths: ['/wp-sitemap-posts-product-1.xml', '/sitemap.xml'],
  },
  {
    id: 'wave-uniforms',
    name: 'Wave Uniforms',
    url: 'https://www.waveuniforms.com/',
    platform: 'shopify',
    exportKey: 'waveUniformsProducts',
    file: 'waveUniformsCatalog.js',
    maxProducts: 2000,
  },
  {
    id: 'pinmar-yacht-supply',
    name: 'Pinmar Yacht Supply',
    url: 'https://pinmaryachtsupply.com/',
    platform: 'shopify',
    exportKey: 'pinmarYachtSupplyProducts',
    file: 'pinmarYachtSupplyCatalog.js',
    uniformOnly: true,
  },
  {
    id: 'waypoint-uae',
    name: 'Waypoint UAE',
    url: 'https://waypointuae.com/',
    platform: 'waypoint',
    exportKey: 'waypointUaeProducts',
    file: 'waypointUaeCatalog.js',
  },
  {
    id: 'musto',
    name: 'Musto',
    url: 'https://www.musto.com/en-gb/',
    platform: 'manual',
    exportKey: 'mustoProducts',
    file: 'mustoCatalog.js',
    notes: 'Site blocks automated fetch (HTTP 403). Musto items are included via The Superyacht Shop.',
  },
  {
    id: 'gill',
    name: 'Gill',
    url: 'https://www.gillmarine.com/',
    platform: 'shopify',
    exportKey: 'gillProducts',
    file: 'gillCatalog.js',
    uniformOnly: true,
  },
  {
    id: 'dubarry',
    name: 'Dubarry',
    url: 'https://www.dubarry.com/',
    platform: 'shopify',
    exportKey: 'dubarryProducts',
    file: 'dubarryCatalog.js',
    uniformOnly: true,
  },
  {
    id: 'unique-crew',
    name: 'Unique Crew SuperYacht Apparel',
    url: 'https://www.unique-crew.com/',
    platform: 'manual',
    exportKey: 'uniqueCrewProducts',
    file: 'uniqueCrewCatalog.js',
    notes: 'Portfolio / brand-partner site without individual product listings.',
  },
];

export function supplierById(id) {
  return SUPPLIER_SOURCES.find((s) => s.id === id);
}

export function supplierByExportKey(exportKey) {
  return SUPPLIER_SOURCES.find((s) => s.exportKey === exportKey);
}

export function importedSupplierSources() {
  return IMPORTED_SUPPLIER_IDS
    .map((id) => supplierById(id))
    .filter(Boolean);
}
