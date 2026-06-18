/**
 * Single source of truth for yacht uniform categories, department tags, and nav filters.
 * Human logic: one garment type, one primary crew department (occasionally two for interior/chief-stew).
 */

export const CATEGORY_IDS = [
  'tops', 'shirts', 'epaulettes', 'dresses', 'bottoms', 'chef-wear',
  'engineering', 'spa-wear', 'outerwear', 'shoes', 'accessories',
];

export const categories = [
  { id: 'tops', label: 'Polos & Tees', layer: 20 },
  { id: 'shirts', label: 'Formal Shirts', layer: 22 },
  { id: 'epaulettes', label: 'Epaulettes & Rank', layer: 23 },
  { id: 'dresses', label: 'Dresses', layer: 25 },
  { id: 'bottoms', label: 'Shorts / Skorts / Trousers', layer: 18 },
  { id: 'chef-wear', label: 'Galley Jackets & Aprons', layer: 19 },
  { id: 'engineering', label: 'Engineering Overalls', layer: 17 },
  { id: 'spa-wear', label: 'Spa Tunics', layer: 21 },
  { id: 'outerwear', label: 'Wet Weather & Outerwear', layer: 30 },
  { id: 'shoes', label: 'Footwear', layer: 35 },
  { id: 'accessories', label: 'Accessories', layer: 40 },
];

export const IMAGE_HINT_BY_CATEGORY = {
  tops: 'polo',
  shirts: 'shirt',
  epaulettes: 'epaulettes',
  dresses: 'dress',
  bottoms: 'shorts',
  'chef-wear': 'chef-jacket',
  engineering: 'overalls',
  'spa-wear': 'shirt',
  outerwear: 'jacket',
  shoes: 'shoes',
  accessories: 'cap',
};

export function imageHintForCategory(category) {
  return IMAGE_HINT_BY_CATEGORY[category] || 'polo';
}

const CONTEXT_CATEGORY_RULES = [
  ['chef-wear', /\b(chef jacket|chef coat|apron)\b/i],
  ['engineering', /\b(overall|boiler suit|coverall)\b/i],
  ['spa-wear', /\b(tunic|spa wear|wellness)\b/i],
  ['outerwear', /\b(jacket|softshell|fleece|foul weather|wet weather|parka|gilet|vest|puffer|windbreaker|blazer)\b/i],
  ['shoes', /\b(shoes?|sneakers?|deck shoe|footwear|loafers?|trainers?|clog|moccasin)\b/i],
  ['accessories', /\b(cap|belt|sunglasses|beanie|scarf|glove|tie|necktie)\b/i],
  ['bottoms', /\b(shorts?|trousers?|pants?|skort|skirt|chino|bermuda)\b/i],
  ['dresses', /\b(dress|gown)\b/i],
  ['tops', /\b(polo|tee|t-shirt|henley|sweater|knit|cardigan|pullover|hoodie|sweatshirt|sweat-shirt|jumper|sweat)\b/i],
  ['shirts', /\b(shirt|blouse|oxford|linen shirt|popeline)\b/i],
];

export function classifyUniformCategory(name, context = '') {
  const title = String(name || '');
  const hay = `${title} ${context}`;

  if (/\b(epaulettes|epaulets)\b/i.test(title) && !/\b(shirt|blouse|polo|dress|top|jacket)\b/i.test(title)) return 'epaulettes';
  if (/\b(coverall|coveralls|overall|boiler suit)\b/i.test(title)) return 'engineering';
  if (/\bdress\s*shirt\b/i.test(title)) return 'shirts';
  if (/\bpolo\s+dress\b/i.test(hay)) return 'tops';
  if (/\b(dress|gown)\b/i.test(title)) return 'dresses';
  if (/\b(tie|necktie)\b/i.test(title)) return 'accessories';
  if (/\b(windbreaker|blazer)\b/i.test(title)) return 'outerwear';
  if (/\b(polo|piqu[eé])\b/i.test(title)) return 'tops';
  if (/\bblouse\b/i.test(title)) return 'shirts';
  if (/\b(apron|chef jacket|chef coat)\b/i.test(title)) return 'chef-wear';
  if (/\b(shoes?|sneakers?|moccasin|loafers?|footwear|clog)\b/i.test(title)) return 'shoes';
  if (/\b(tee|t-shirt|tshirt|henley|hoodie|sweatshirt|sweat-shirt|sweater|jumper|cardigan)\b/i.test(title)) return 'tops';

  for (const [id, re] of CONTEXT_CATEGORY_RULES) {
    if (id === 'accessories' && /\bcap\s+sleeve\b/i.test(hay)) continue;
    if (id === 'dresses' && /\bdress\s*shirt\b/i.test(hay)) continue;
    if (id === 'bottoms' && /\b(t-shirt|tee\b|blouse|shirt|jacket|polo)\b/i.test(title)) continue;
    if (id === 'shirts' && /\b(t-shirt|tee\b|polo|henley|sweatshirt|sweat-shirt|hoodie)\b/i.test(hay)) continue;
    if (re.test(hay)) return id;
  }
  return 'tops';
}

function titleLower(product) {
  const name = typeof product === 'string' ? product : product?.name;
  return String(name || '').toLowerCase();
}

function productContextLower(product) {
  return `${product?.name || ''} ${String(product?.details || '').slice(0, 240)}`.toLowerCase();
}

function isLadies(text) {
  return /\b(ladies|women'?s?|womens|female)\b/i.test(text)
    || /\bshirt\s+w\b/i.test(text)
    || /\bchino\s+w\b/i.test(text);
}

function isMens(title) {
  return /\b(men'?s?|mens|male)\b/i.test(title) && !isLadies(title);
}

export function isOnePieceDress(product) {
  const name = titleLower(product);
  if (!/\bdress\b/.test(name)) return false;
  if (/\bdress\s*shirt\b/.test(name)) return false;
  if (/\b(shirt|jacket|vest|softshell|blouse|polo|skort|tunic|apron)\b/.test(name)) return false;
  return true;
}

export function isDressShirt(product) {
  return product.category === 'shirts' && /\bdress\s*shirt\b/i.test(product.name);
}

export function isEpauletteShirt(product) {
  if (product.category !== 'shirts') return false;
  return /\b(epaulette|shoulder tabs?|with tabs)\b/i.test(product.name);
}

export function isBlouse(product) {
  return product.category === 'shirts' && /\bblouse\b/i.test(product.name);
}

function isPolo(product) {
  return product.category === 'tops' && /\b(polo|piqu[eé])\b/i.test(titleLower(product));
}

function isTee(product) {
  const title = titleLower(product);
  return product.category === 'tops'
    && /\b(tee|t-shirt|tshirt)\b/i.test(title)
    && !/\b(polo|piqu[eé])\b/i.test(title);
}

function isKnitwear(product) {
  const title = titleLower(product);
  return product.category === 'tops'
    && /\b(knit|sweater|pullover|cardigan|sweatshirt|sweat-shirt|hoodie|jumper|sweat)\b/i.test(title);
}

function isWorkShort(product) {
  const title = titleLower(product);
  return product.category === 'bottoms'
    && /\b(short|bermuda|board short)\b/i.test(title)
    && !/\bt-shirt\b/i.test(title);
}

function isFormalTrouser(product) {
  const title = titleLower(product);
  return product.category === 'bottoms'
    && /\b(chino|suit pant|elegance pant|cotton pant)\b/i.test(title)
    && !/\b(quick dry|technical|performance|cargo)\b/i.test(title);
}

function isWorkTrouser(product) {
  const title = titleLower(product);
  return product.category === 'bottoms'
    && /\b(trouser|trousers|pant|pants|cargo pant)\b/i.test(title)
    && /\b(quick dry|technical|performance|cargo)\b/i.test(title);
}

function isSkortOrSkirt(product) {
  const title = titleLower(product);
  return product.category === 'bottoms' && /\b(skort|skirt)\b/i.test(title);
}

function isSoftshell(product) {
  return product.category === 'outerwear' && /\bsoftshell\b/i.test(titleLower(product));
}

function isBlazer(product) {
  return product.category === 'outerwear' && /\bblazer\b/i.test(titleLower(product));
}

function isVest(product) {
  return product.category === 'outerwear' && /\b(vest|puffer)\b/i.test(titleLower(product));
}

function isFoulWeather(product) {
  const title = titleLower(product);
  return product.category === 'outerwear'
    && /\b(foul|wet weather|windbreaker|hydraplus)\b/i.test(title);
}

function isZipJacket(product) {
  const title = titleLower(product);
  return product.category === 'outerwear'
    && /\bjacket\b/i.test(title)
    && !isSoftshell(product)
    && !isBlazer(product)
    && !isVest(product)
    && !isFoulWeather(product)
    && !/\bfleece\b/i.test(title);
}

function isTie(product) {
  return product.category === 'accessories' && /\b(tie|necktie)\b/i.test(titleLower(product));
}

function isTechnicalWorkwear(title) {
  return /\b(technical|performance|quick dry|cargo|coverall|coverguard|safety|dickies|engineer)\b/i.test(title);
}

function isEleganceLine(title) {
  return /\belegance\b/i.test(title);
}

function isOfficerKnit(product) {
  const title = titleLower(product);
  return isKnitwear(product)
    && /\b(cardigan|jumper|sweater|merinos)\b/i.test(title)
    && !/\b(hoodie|sweat)\b/i.test(title);
}

const EPAULETTE_RANK_DEPT = {
  Deck: ['deckhand', 'deck', 'captain', 'bosun', 'officer'],
  Engineering: ['engineer', 'engineering'],
  Interior: ['stew', 'stewardess', 'chief-stew', 'chief stewardess'],
  Galley: ['chef'],
};

export const NAV_SECTION_LABELS = { department: 'Departments', shared: 'Catalog', catalog: 'Suppliers' };

export const ALL_SUPPLIERS_NAV_ID = 'all-suppliers';

export const navCategories = [
  { id: ALL_SUPPLIERS_NAV_ID, section: 'catalog', label: 'All Suppliers', categories: CATEGORY_IDS, subFilters: ['All'] },
  { id: 'bridge', section: 'department', label: 'Bridge', departments: ['captain', 'boss'], subFilters: ['All', 'Epaulette Shirts', 'Officer Shirts', 'Trousers', 'Knitwear', 'Blazers', 'Ties'] },
  { id: 'deck', section: 'department', label: 'Deck', departments: ['deck'], subFilters: ['All', 'Polos', 'T-Shirts', 'Shorts', 'Trousers', 'Knitwear', 'Softshell', 'Jackets', 'Vests', 'Foul Weather'] },
  { id: 'engineering', section: 'department', label: 'Engineering', departments: ['engineer'], subFilters: ['All', 'Overalls', 'Polos', 'T-Shirts', 'Shorts', 'Trousers', 'Shoes'] },
  { id: 'interior', section: 'department', label: 'Interior', departments: ['interior', 'chief-stew'], subFilters: ['All', 'Dresses', 'Skorts', 'Blouses', 'Dress Shirts', 'Polos', 'T-Shirts', 'Shorts', 'Trousers', 'Knitwear', 'Softshell', 'Jackets', 'Vests', 'Foul Weather', 'Blazers'] },
  { id: 'galley', section: 'department', label: 'Galley', departments: ['chef'], subFilters: ['All', 'Jackets', 'Trousers', 'Aprons', 'Shoes'] },
  { id: 'spa', section: 'department', label: 'Spa', departments: ['spa'], subFilters: ['All', 'Tunics', 'Trousers'] },
  { id: 'epaulettes', section: 'shared', label: 'Epaulettes & Rank', categories: ['epaulettes'], subFilters: ['All', 'Deck', 'Engineering', 'Interior', 'Galley'] },
  { id: 'footwear', section: 'shared', label: 'Footwear', categories: ['shoes'], subFilters: ['All', 'Deck', 'Interior', 'Galley', 'Non-Marking'] },
  { id: 'outerwear', section: 'shared', label: 'Wet Weather & Outerwear', categories: ['outerwear'], subFilters: ['All', 'Softshell', 'Jacket', 'Fleece', 'Foul Weather', 'Vests'] },
  { id: 'accessories', section: 'shared', label: 'Accessories', categories: ['accessories'], subFilters: ['All', 'Caps', 'Belts', 'Ties', 'Sunglasses'] },
];

export const DEPARTMENT_CATEGORIES = {
  bridge: ['shirts', 'tops', 'bottoms', 'outerwear', 'accessories'],
  deck: ['tops', 'bottoms', 'outerwear'],
  engineering: ['tops', 'bottoms', 'engineering', 'outerwear', 'shoes'],
  interior: ['tops', 'shirts', 'bottoms', 'dresses', 'outerwear'],
  galley: ['chef-wear', 'bottoms', 'shoes'],
  spa: ['spa-wear', 'bottoms'],
};

const SUBFILTER_MATCHERS = {
  'Epaulette Shirts': isEpauletteShirt,
  'Officer Shirts': (p) => {
    if (p.category !== 'shirts' || isEpauletteShirt(p) || isBlouse(p)) return false;
    const title = titleLower(p);
    if (/\bdeck\b/i.test(title)) return false;
    return isDressShirt(p)
      || isMens(title)
      || /\b(pilot shirt|oxford|popeline|poplin)\b/i.test(title);
  },
  Knitwear: isKnitwear,
  Blazers: isBlazer,
  Ties: isTie,
  Polos: isPolo,
  'T-Shirts': isTee,
  Shorts: isWorkShort,
  Shirts: isDeckWorkShirt,
  Overalls: (p) => p.category === 'engineering',
  Softshell: isSoftshell,
  Dresses: (p) => p.category === 'dresses' && isOnePieceDress(p),
  Skorts: isSkortOrSkirt,
  Blouses: isBlouse,
  'Dress Shirts': isDressShirt,
  Jackets: (p) => ['chef-wear', 'outerwear'].includes(p.category) && /\bjacket\b/i.test(titleLower(p)),
  Aprons: (p) => p.category === 'chef-wear' && /\bapron\b/i.test(titleLower(p)),
  Shoes: (p) => p.category === 'shoes',
  Tunics: (p) => p.category === 'spa-wear',
  Trousers: (p) => isFormalTrouser(p) || isWorkTrouser(p),
  Jacket: (p) => isZipJacket(p) || (p.category === 'outerwear' && /\bjacket\b/i.test(titleLower(p)) && !isSoftshell(p) && !isBlazer(p) && !isVest(p) && !/\bfleece\b/i.test(titleLower(p)) && !isFoulWeather(p)),
  Fleece: (p) => p.category === 'outerwear' && /\bfleece\b/i.test(titleLower(p)),
  'Foul Weather': isFoulWeather,
  Vests: isVest,
  'Non-Marking': (p) => p.category === 'shoes' && /\bnon[- ]?mark/i.test(titleLower(p)),
  Caps: (p) => p.category === 'accessories' && /\bcap\b/i.test(titleLower(p)),
  Belts: (p) => p.category === 'accessories' && /\bbelt\b/i.test(titleLower(p)),
  Sunglasses: (p) => p.category === 'accessories' && /\bsunglass/i.test(titleLower(p)),
  Deck: (p) => p.category === 'shoes' && /\b(deck|anchor|sneaker|yacht crew|all-terrain|at lite|at hdry|tropicfeel|coverguard|safety)\b/i.test(titleLower(p)),
  Interior: (p) => p.category === 'shoes' && /\b(ballerina|casual leather|sunset)\b/i.test(titleLower(p)),
  Galley: (p) => p.category === 'shoes' && /\b(chef|galley|kitchen|moccasin)\b/i.test(titleLower(p)),
};

function isDeckWorkShirt(product) {
  return product.category === 'shirts'
    && !isDressShirt(product)
    && !isBlouse(product)
    && !isEpauletteShirt(product);
}

/** One primary crew department per item (interior + chief-stew may pair). */
export function inferDepartmentTags(product) {
  const cat = product.category;
  const title = titleLower(product);
  const context = productContextLower(product);
  const ladies = isLadies(context);

  if (cat === 'epaulettes') return [];

  if (cat === 'engineering') return ['engineer'];
  if (cat === 'chef-wear') return ['chef'];
  if (cat === 'spa-wear') return ['spa'];
  if (cat === 'dresses') return ['interior', 'chief-stew'];

  if (cat === 'shoes') {
    if (/\b(chef|galley|kitchen|moccasin)\b/i.test(title)) return ['chef'];
    if (/\b(ballerina|casual leather|sunset)\b/i.test(title)) return ['interior', 'chief-stew'];
    if (/\b(safety|coverguard)\b/i.test(title)) return ['engineer'];
    return ['deck'];
  }

  if (cat === 'accessories') {
    if (/\b(tie|necktie)\b/i.test(title)) return ['captain'];
    return ['deck'];
  }

  if (cat === 'outerwear') {
    if (/\bblazer\b/i.test(title)) return ['captain', 'interior', 'chief-stew'];
    return ladies ? ['interior', 'chief-stew'] : ['deck'];
  }

  if (cat === 'shirts') {
    if (/\bdeck\b/i.test(title)) return ladies ? ['interior', 'chief-stew'] : ['deck'];
    if (isEpauletteShirt(product)) return ['captain'];
    if (isBlouse(product)) return ['interior', 'chief-stew'];
    if (isDressShirt(product)) {
      return ladies ? ['captain', 'interior', 'chief-stew'] : ['captain'];
    }
    if (/\bmandarin\b/i.test(title)) return ['captain'];
    return ladies ? ['interior', 'chief-stew'] : ['captain'];
  }

  if (cat === 'tops') {
    if (/\b(polo|piqu)/i.test(title)) {
      if (isTechnicalWorkwear(title)) return ['engineer'];
      return ladies ? ['interior', 'chief-stew'] : ['deck'];
    }
    if (isOfficerKnit(product)) return ladies ? ['interior', 'chief-stew'] : ['captain'];
    if (isKnitwear(product)) return ladies ? ['interior', 'chief-stew'] : ['deck'];
    if (isTechnicalWorkwear(title)) return ['engineer'];
    return ladies ? ['interior', 'chief-stew'] : ['deck'];
  }

  if (cat === 'bottoms') {
    if (/\bdeck\b/i.test(title)) return ladies ? ['interior', 'chief-stew'] : ['deck'];
    if (/\b(chef|galley)\b/i.test(title)) return ['chef'];
    if (/\b(skort|skirt)\b/i.test(title)) return ['interior', 'chief-stew'];
    if (isEleganceLine(title)) {
      if (/\b(bermuda|short)\b/i.test(title)) {
        return ladies ? ['interior', 'chief-stew'] : ['deck'];
      }
      return ladies ? ['interior', 'chief-stew'] : ['captain'];
    }
    if (/\b(bermuda|short|board short)\b/i.test(title) && !/\bt-shirt\b/i.test(title)) {
      if (isTechnicalWorkwear(title)) return ['engineer'];
      return ladies ? ['interior', 'chief-stew'] : ['deck'];
    }
    if (/\b(quick dry|technical|performance|cargo)\b/i.test(title)) {
      return ladies ? ['interior', 'chief-stew'] : ['engineer'];
    }
    if (/\b(chino|suit pant|elegance pant|cotton pant)\b/i.test(title)) {
      return ladies ? ['interior', 'chief-stew'] : ['captain'];
    }
    return ['deck'];
  }

  return ['deck'];
}

export function productMatchesNav(product, nav) {
  if (nav.categories?.length) return nav.categories.includes(product.category);
  if (!nav.departments?.length) return true;

  if (product.category === 'epaulettes') return false;

  const allowed = DEPARTMENT_CATEGORIES[nav.id];
  if (allowed && !allowed.includes(product.category)) return false;

  if (product.category === 'accessories') {
    if (isTie(product)) return nav.id === 'bridge';
    return false;
  }

  if (product.category === 'shoes') {
    if (nav.id === 'galley') return (product.roleTags || []).includes('chef');
    if (nav.id === 'engineering') return (product.roleTags || []).includes('engineer');
    return false;
  }

  if (product.category === 'shirts' && nav.id === 'deck') return false;

  const tags = product.roleTags || [];
  if (!tags.length) return false;

  const deptSet = new Set(nav.departments);
  if (deptSet.has('captain')) deptSet.add('boss');
  return tags.some((t) => deptSet.has(t));
}

function departmentSubFilters(navId) {
  const nav = navCategories.find((n) => n.id === navId);
  if (!nav?.departments?.length || !nav.subFilters?.length) return null;
  const subs = nav.subFilters.filter((s) => s !== 'All');
  return subs.length ? subs : null;
}

export function productMatchesSubFilter(product, subFilter, navId = '') {
  if (!subFilter || subFilter === 'All') {
    const subs = departmentSubFilters(navId);
    if (subs) {
      return subs.some((s) => productMatchesSubFilter(product, s, navId));
    }
    return true;
  }

  if (navId === 'epaulettes' && EPAULETTE_RANK_DEPT[subFilter]) {
    if (product.category !== 'epaulettes') return false;
    const title = titleLower(product);
    return EPAULETTE_RANK_DEPT[subFilter].some((term) => title.includes(term));
  }

  if (subFilter === 'Trousers') {
    if (navId === 'bridge') return isFormalTrouser(product) && !isLadies(productContextLower(product));
    if (navId === 'interior') {
      return isFormalTrouser(product)
        || (isLadies(titleLower(product)) && isWorkTrouser(product));
    }
    if (navId === 'engineering' || navId === 'deck') return isWorkTrouser(product);
    if (navId === 'galley' || navId === 'spa') {
      return product.category === 'bottoms' && (product.roleTags || []).includes(navId === 'galley' ? 'chef' : 'spa');
    }
    return isFormalTrouser(product) || isWorkTrouser(product);
  }

  const matcher = SUBFILTER_MATCHERS[subFilter];
  return matcher ? matcher(product) : true;
}

export function catalogNavForProduct(product) {
  const categoryNav = navCategories.find((n) =>
    n.id !== ALL_SUPPLIERS_NAV_ID && n.categories?.includes(product.category),
  );
  if (categoryNav) return categoryNav.id;

  const tags = product.roleTags || [];
  if (tags.length) {
    const deptNav = navCategories.find((n) => {
      if (!n.departments?.length) return false;
      const deptSet = new Set(n.departments);
      if (deptSet.has('captain')) deptSet.add('boss');
      return tags.some((t) => deptSet.has(t));
    });
    if (deptNav) return deptNav.id;
  }

  return navCategories.find((n) => n.departments?.length)?.id || ALL_SUPPLIERS_NAV_ID;
}

export function normalizeUniformProduct(product) {
  const category = classifyUniformCategory(product.name, product.details || '');
  return {
    ...product,
    category,
    imageHint: imageHintForCategory(category),
    roleTags: inferDepartmentTags({ ...product, category }),
  };
}

export function validateUniformProduct(product) {
  const issues = [];
  const title = product.name || '';
  const expected = classifyUniformCategory(title, product.details || '');

  if (product.category !== expected) issues.push(`category should be ${expected}, got ${product.category}`);
  if (product.category === 'dresses' && !isOnePieceDress(product)) issues.push('not a one-piece dress');
  if (isDressShirt(product) && (product.roleTags || []).includes('deck')) issues.push('dress shirt must not be tagged deck');
  if (isDressShirt(product) && (product.roleTags || []).includes('engineer')) issues.push('dress shirt must not be tagged engineer');
  if (isBlouse(product) && (product.roleTags || []).includes('deck')) issues.push('blouse must not be tagged deck');
  if ((product.roleTags || []).includes('deck') && (product.roleTags || []).includes('engineer')) {
    issues.push('cannot tag both deck and engineer');
  }
  if (product.category === 'engineering' && !(product.roleTags || []).includes('engineer')) issues.push('overalls must be engineer only');
  if (!product.roleTags?.length && product.category !== 'epaulettes') issues.push('missing roleTags');

  const inferred = inferDepartmentTags(product);
  for (const tag of inferred) {
    if (!(product.roleTags || []).includes(tag)) issues.push(`missing roleTag: ${tag}`);
  }
  for (const tag of product.roleTags || []) {
    if (!inferred.includes(tag)) issues.push(`extra roleTag: ${tag}`);
  }
  return issues;
}

export function validateUniformCatalog(products = []) {
  const issues = [];
  for (const product of products) {
    for (const msg of validateUniformProduct(product)) issues.push(`${product.name}: ${msg}`);
  }

  for (const nav of navCategories) {
    if (!nav.departments) continue;
    const visible = products.filter((p) => productMatchesNav(p, nav));
    for (const sub of nav.subFilters) {
      if (sub === 'All') continue;
      const filtered = visible.filter((p) => productMatchesSubFilter(p, sub, nav.id));
      if (sub === 'Overalls' && filtered.some((p) => p.category !== 'engineering')) {
        issues.push(`${nav.label}/${sub} has non-overalls`);
      }
      if (sub === 'Dresses' && filtered.some((p) => !isOnePieceDress(p))) {
        issues.push(`${nav.label}/${sub} has non-dresses`);
      }
      if (sub === 'Polos' && filtered.some((p) => !isPolo(p))) {
        issues.push(`${nav.label}/${sub} has non-polos: ${filtered.filter((p) => !isPolo(p)).map((p) => p.name).join(', ')}`);
      }
      if (sub === 'T-Shirts' && filtered.some((p) => !isTee(p))) {
        issues.push(`${nav.label}/${sub} has non-tees: ${filtered.filter((p) => !isTee(p)).map((p) => p.name).join(', ')}`);
      }
      if (sub === 'Epaulette Shirts' && filtered.some((p) => !isEpauletteShirt(p))) {
        issues.push(`${nav.label}/${sub} has non-epaulette shirts`);
      }
      if (sub === 'Dress Shirts' && filtered.some((p) => !isDressShirt(p))) {
        issues.push(`${nav.label}/${sub} has non-dress shirts`);
      }
      if (sub === 'Blouses' && filtered.some((p) => !isBlouse(p))) {
        issues.push(`${nav.label}/${sub} has non-blouses`);
      }
      if (sub === 'Shirts' && filtered.some((p) => isDressShirt(p) || isBlouse(p))) {
        issues.push(`${nav.label}/${sub} has formal/blouse shirts`);
      }
    }
    for (const p of visible) {
      const title = titleLower(p);
      const ladies = isLadies(title);
      const mens = isMens(title);
      if (nav.id === 'deck' && ladies) issues.push(`Deck nav shows ladies item: ${p.name}`);
      if (nav.id === 'interior' && mens && !isBlazer(p)) issues.push(`Interior nav shows mens item: ${p.name}`);
      if (nav.id === 'bridge' && ladies && !isDressShirt(p) && !isBlouse(p) && !isEpauletteShirt(p) && !isBlazer(p) && !isTie(p)) {
        issues.push(`Bridge nav shows ladies non-officer item: ${p.name}`);
      }
      if (isDressShirt(p) && nav.id === 'deck') issues.push(`Deck nav shows dress shirt: ${p.name}`);
      if (isBlouse(p) && (nav.id === 'deck' || nav.id === 'engineering')) {
        issues.push(`${nav.label} nav shows blouse: ${p.name}`);
      }
      if (p.category === 'epaulettes') issues.push(`${nav.label} nav shows rank epaulettes: ${p.name}`);
      const subs = nav.subFilters.filter((s) => s !== 'All');
      const matchesAny = subs.some((s) => productMatchesSubFilter(p, s, nav.id));
      if (!matchesAny) issues.push(`${nav.label} orphan (no sub-filter): ${p.name}`);
    }
  }
  return issues;
}
