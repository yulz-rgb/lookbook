import { describe, it, expect } from 'vitest';
import { marinaProducts } from './marinaCatalog.js';
import {
  classifyUniformCategory,
  inferDepartmentTags,
  normalizeUniformProduct,
  validateUniformCatalog,
  validateUniformProduct,
  productMatchesNav,
  productMatchesSubFilter,
  navCategories,
  isOnePieceDress,
} from './uniformTaxonomy.js';

describe('classifyUniformCategory', () => {
  it('classifies by human garment type', () => {
    expect(classifyUniformCategory('Gold Third Engineer Epaulettes')).toBe('epaulettes');
    expect(classifyUniformCategory('Ladies Popeline Long Sleeve Dress Shirt RUSSEL')).toBe('shirts');
    expect(classifyUniformCategory('Ladies V-Neck Dress')).toBe('dresses');
    expect(classifyUniformCategory('Dickies Short sleeve Coveralls')).toBe('engineering');
    expect(classifyUniformCategory('Clip-on tie')).toBe('accessories');
    expect(classifyUniformCategory('Ladies Evening Suit Blazer')).toBe('outerwear');
    expect(classifyUniformCategory('Non-Slip Yacht Crew Sneakers')).toBe('shoes');
    expect(classifyUniformCategory('Ladies Short Sleeve Blouse')).toBe('shirts');
    expect(classifyUniformCategory('Men\'s Short Sleeve Piqué Polo')).toBe('tops');
    expect(classifyUniformCategory('Ladies Short Sleeve T-shirt Premium')).toBe('tops');
  });
});

describe('inferDepartmentTags', () => {
  it('assigns rank epaulettes no department tags', () => {
    expect(inferDepartmentTags({ category: 'epaulettes', name: 'Gold captain epaulettes' })).toEqual([]);
  });

  it('assigns engineering coveralls to engineer only', () => {
    expect(inferDepartmentTags({ category: 'engineering', name: 'Long sleeve Coveralls Result' }))
      .toEqual(['engineer']);
  });

  it('assigns dresses to interior', () => {
    expect(inferDepartmentTags({ category: 'dresses', name: 'Ladies V-Neck Dress' }))
      .toEqual(['interior', 'chief-stew']);
  });

  it('assigns deck sneakers correctly', () => {
    expect(inferDepartmentTags({ category: 'shoes', name: 'Non-Slip Yacht Crew Sneakers' }))
      .toEqual(['deck']);
  });

  it('never tags the same item for both deck and engineering', () => {
    for (const product of marinaProducts) {
      const tags = product.roleTags || [];
      expect(tags.includes('deck') && tags.includes('engineer')).toBe(false);
    }
  });

  it('keeps ladies service outerwear out of deck nav', () => {
    const deck = navCategories.find((n) => n.id === 'deck');
    const ladiesJackets = marinaProducts.filter(
      (p) => /ladies/i.test(p.name) && p.category === 'outerwear' && productMatchesNav(p, deck),
    );
    expect(ladiesJackets).toEqual([]);
  });

  it('keeps engineering distinct from deck inventory', () => {
    const deck = navCategories.find((n) => n.id === 'deck');
    const engineering = navCategories.find((n) => n.id === 'engineering');
    const deckIds = new Set(marinaProducts.filter((p) => productMatchesNav(p, deck)).map((p) => p.id));
    const engineeringItems = marinaProducts.filter((p) => productMatchesNav(p, engineering));
    const overlap = engineeringItems.filter((p) => deckIds.has(p.id));
    expect(overlap).toEqual([]);
    expect(engineeringItems.length).toBeGreaterThan(0);
    expect(engineeringItems.length).toBeLessThan(40);
  });

  it('tags deck shirts for deck, not bridge', () => {
    expect(inferDepartmentTags({ category: 'shirts', name: 'Slam Deck Yacht Shirt' }))
      .toEqual(['deck']);
    expect(inferDepartmentTags({ category: 'shirts', name: 'Slam Deck Shirt W' }))
      .toEqual(['interior', 'chief-stew']);
    expect(inferDepartmentTags({ category: 'bottoms', name: 'Slam Deck Light Chino' }))
      .toEqual(['deck']);
  });

  it('tags ladies yacht crew pants for interior, not engineering', () => {
    const handles = [
      'marina-ladies-elegance-pant',
      'marina-ladies-performance-pant',
      'marina-ladies-quick-dry-pant-proact',
      'marina-ladies-chino-pant',
      'marina-ladies-cotton-pant-native-spirit',
      'marina-ladies-technical-pant',
    ];
    const interior = navCategories.find((n) => n.id === 'interior');
    for (const id of handles) {
      const product = marinaProducts.find((p) => p.id === id);
      expect(product, id).toBeTruthy();
      expect(inferDepartmentTags(product)).toEqual(['interior', 'chief-stew']);
      expect(productMatchesNav(product, interior)).toBe(true);
      expect(productMatchesSubFilter(product, 'Trousers', 'interior')).toBe(true);
    }
  });
});

describe('productMatchesNav with roleTags', () => {
  const engineering = navCategories.find((n) => n.id === 'engineering');
  const interior = navCategories.find((n) => n.id === 'interior');
  const epaulettesNav = navCategories.find((n) => n.id === 'epaulettes');

  it('hides engineer epaulettes from engineering department', () => {
    const rank = { category: 'epaulettes', name: 'Gold Third Engineer Epaulettes', roleTags: [] };
    expect(productMatchesNav(rank, engineering)).toBe(false);
    expect(productMatchesNav(rank, epaulettesNav)).toBe(true);
  });

  it('shows coveralls only in engineering when tagged', () => {
    const overalls = { category: 'engineering', name: 'Coveralls', roleTags: ['engineer'] };
    const dress = { category: 'dresses', name: 'Ladies V-Neck Dress', roleTags: ['interior', 'chief-stew'] };
    expect(productMatchesNav(overalls, engineering)).toBe(true);
    expect(productMatchesNav(dress, engineering)).toBe(false);
    expect(productMatchesNav(dress, interior)).toBe(true);
  });
});

describe('marina catalog integrity', () => {
  it('passes full taxonomy validation', () => {
    expect(validateUniformCatalog(marinaProducts)).toEqual([]);
  });

  it('every product has category and roleTags where required', () => {
    for (const product of marinaProducts) {
      expect(validateUniformProduct(product)).toEqual([]);
    }
  });

  it('every department subfilter is clean', () => {
    for (const nav of navCategories) {
      const visible = marinaProducts.filter((p) => productMatchesNav(p, nav));
      for (const sub of nav.subFilters) {
        if (sub === 'All') continue;
        const items = visible.filter((p) => productMatchesSubFilter(p, sub, nav.id));
        if (sub === 'Overalls') {
          expect(items.every((p) => p.category === 'engineering')).toBe(true);
        }
        if (sub === 'Dresses') {
          expect(items.every((p) => isOnePieceDress(p))).toBe(true);
        }
        if (sub === 'Polos') {
          expect(items.every((p) => /\b(polo|piqu)/i.test(p.name))).toBe(true);
        }
      }
    }
  });
});

describe('normalizeUniformProduct', () => {
  it('recomputes category imageHint and roleTags', () => {
    const raw = { name: 'Dickies Short sleeve Coveralls', category: 'bottoms', roleTags: [] };
    const normalized = normalizeUniformProduct(raw);
    expect(normalized.category).toBe('engineering');
    expect(normalized.imageHint).toBe('overalls');
    expect(normalized.roleTags).toEqual(['engineer']);
  });
});
