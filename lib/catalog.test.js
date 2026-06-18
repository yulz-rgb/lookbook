import { describe, it, expect } from 'vitest';
import {
  productMatchesNav,
  productMatchesSubFilter,
  catalogNavForProduct,
  navCategories,
  productMatchesBodyType,
  productMatchesDressFilter,
  resolveProductFit,
  defaultProducts,
  marinaDefaultProducts,
  importedSupplierCatalog,
} from './catalog.js';
import { IMPORTED_SUPPLIER_IDS } from './supplierSources.js';
import { supplierCatalogExports } from './supplierCatalogs/index.js';
import { guessCategory } from './catalogExtract.js';

describe('productMatchesNav', () => {
  const bridge = navCategories.find((n) => n.id === 'bridge');
  const footwear = navCategories.find((n) => n.id === 'footwear');

  it('hides untagged products from department navs', () => {
    const polo = { category: 'tops', roleTags: [] };
    expect(productMatchesNav(polo, bridge)).toBe(false);
  });

  it('filters tagged products to matching departments', () => {
    const deckPolo = { category: 'tops', roleTags: ['deck'] };
    const deckNav = navCategories.find((n) => n.id === 'deck');
    expect(productMatchesNav(deckPolo, deckNav)).toBe(true);
    expect(productMatchesNav(deckPolo, bridge)).toBe(false);
  });

  it('still filters shared category navs by category', () => {
    const shoe = { category: 'shoes', roleTags: [] };
    const polo = { category: 'tops', roleTags: [] };
    expect(productMatchesNav(shoe, footwear)).toBe(true);
    expect(productMatchesNav(polo, footwear)).toBe(false);
  });

  it('keeps rank epaulettes out of department navs', () => {
    const rank = { category: 'epaulettes', name: 'Gold Third Engineer Epaulettes', roleTags: [] };
    const bridge = navCategories.find((n) => n.id === 'bridge');
    const engineering = navCategories.find((n) => n.id === 'engineering');
    expect(productMatchesNav(rank, bridge)).toBe(false);
    expect(productMatchesNav(rank, engineering)).toBe(false);
  });
});

describe('productMatchesSubFilter', () => {
  it('shows only engineering overalls, not engineer epaulettes', () => {
    const overalls = { category: 'engineering', name: 'Engineering Overalls' };
    const epaulettes = { category: 'epaulettes', name: 'Gold Third Engineer Epaulettes' };
    expect(productMatchesSubFilter(overalls, 'Overalls', 'engineering')).toBe(true);
    expect(productMatchesSubFilter(epaulettes, 'Overalls', 'engineering')).toBe(false);
  });

  it('shows only one-piece dresses under Interior > Dresses', () => {
    const dress = { category: 'dresses', name: 'Ladies V-Neck Dress' };
    const dressShirt = { category: 'shirts', name: 'Ladies Popeline Long Sleeve Dress Shirt RUSSEL' };
    expect(productMatchesSubFilter(dress, 'Dresses', 'interior')).toBe(true);
    expect(productMatchesSubFilter(dressShirt, 'Dresses', 'interior')).toBe(false);
  });

  it('routes epaulette rank subfilters only within epaulettes nav', () => {
    const engineerRank = { category: 'epaulettes', name: 'Gold Chief Engineer Epaulettes' };
    const captainRank = { category: 'epaulettes', name: 'Gold captain epaulettes' };
    expect(productMatchesSubFilter(engineerRank, 'Engineering', 'epaulettes')).toBe(true);
    expect(productMatchesSubFilter(captainRank, 'Engineering', 'epaulettes')).toBe(false);
    expect(productMatchesSubFilter(captainRank, 'Deck', 'epaulettes')).toBe(true);
  });

  it('keeps bridge All to officer wardrobe only', () => {
    const bridge = navCategories.find((n) => n.id === 'bridge');
    const bridgeVisible = (product) =>
      productMatchesNav(product, bridge) && productMatchesSubFilter(product, 'All', 'bridge');
    const excluded = [
      { category: 'chef-wear', name: 'Ladies Long Sleeve Chef Jacket Larissa', roleTags: ['chef'] },
      { category: 'engineering', name: 'Dickies Short sleeve Coveralls', roleTags: ['engineer'] },
      { category: 'shoes', name: 'Safety Shoes COVERGUARD', roleTags: ['engineer'] },
      { category: 'accessories', name: 'Delta Snapback Cap FLEXFIT', roleTags: ['deck'] },
      { category: 'tops', name: 'Kids Cotton Cap', roleTags: ['deck'] },
      { category: 'shirts', name: 'Slam Deck Yacht Shirt', roleTags: ['deck'] },
      { category: 'tops', name: 'TeeJays Luxury Comfort', roleTags: ['captain'] },
    ];
    for (const product of excluded) {
      expect(bridgeVisible(product), product.name).toBe(false);
    }
    const tie = { category: 'accessories', name: 'Satin Tie', roleTags: ['captain'] };
    expect(bridgeVisible(tie)).toBe(true);
  });

  it('limits department views to relevant garment categories', () => {
    const epaulettes = { category: 'epaulettes', name: 'Gold captain epaulettes' };
    const polo = { category: 'tops', name: 'Deck Polo', roleTags: ['deck', 'engineer'] };
    const tie = { category: 'accessories', name: 'Satin Tie', roleTags: ['captain'] };
    const shoe = { category: 'shoes', name: 'Deck Shoe', roleTags: ['deck'] };
    expect(productMatchesNav(epaulettes, navCategories.find((n) => n.id === 'engineering'))).toBe(false);
    expect(productMatchesSubFilter(polo, 'All', 'engineering')).toBe(true);
    expect(productMatchesNav(polo, navCategories.find((n) => n.id === 'epaulettes'))).toBe(false);
    expect(productMatchesNav(tie, navCategories.find((n) => n.id === 'bridge'))).toBe(true);
    expect(productMatchesNav(shoe, navCategories.find((n) => n.id === 'deck'))).toBe(false);
    expect(productMatchesNav(shoe, navCategories.find((n) => n.id === 'galley'))).toBe(false);
    expect(productMatchesNav({ category: 'shoes', name: 'Chef Moccasin', roleTags: ['chef'] }, navCategories.find((n) => n.id === 'galley'))).toBe(true);
  });

  it('keeps polos and tees distinct by product name', () => {
    const polo = { category: 'tops', name: 'Men\'s Long Sleeve Technical Polo', imageHint: 'polo' };
    const tee = { category: 'tops', name: 'Men\'s Combed Cotton T-Shirt', imageHint: 'polo' };
    expect(productMatchesSubFilter(polo, 'Polos', 'deck')).toBe(true);
    expect(productMatchesSubFilter(tee, 'Polos', 'deck')).toBe(false);
    expect(productMatchesSubFilter(tee, 'T-Shirts', 'deck')).toBe(true);
  });
});

describe('catalogNavForProduct', () => {
  it('routes shared categories to their catalog nav', () => {
    expect(catalogNavForProduct({ category: 'shoes', roleTags: [] })).toBe('footwear');
    expect(catalogNavForProduct({ category: 'accessories', roleTags: [] })).toBe('accessories');
  });

  it('routes tagged products to matching department nav', () => {
    expect(catalogNavForProduct({ category: 'tops', roleTags: ['deck'] })).toBe('deck');
    expect(catalogNavForProduct({ category: 'tops', roleTags: ['interior'] })).toBe('interior');
  });

  it('defaults untagged garments to bridge', () => {
    expect(catalogNavForProduct({ category: 'tops', roleTags: [] })).toBe('bridge');
  });
});

describe('productMatchesDressFilter', () => {
  it('includes actual dresses', () => {
    expect(productMatchesDressFilter({ name: 'Ladies V-Neck Dress' })).toBe(true);
    expect(productMatchesDressFilter({ name: 'Ladies 3/4 Sleeve Dress' })).toBe(true);
    expect(productMatchesDressFilter({ name: 'Straight Dress Kariban Premium' })).toBe(true);
  });

  it('excludes dress shirts, jackets, and prose false positives', () => {
    expect(productMatchesDressFilter({ name: 'Ladies Popeline Long Sleeve Dress Shirt RUSSEL' })).toBe(false);
    expect(productMatchesDressFilter({ name: 'Ladies Long Sleeve Elegance Dress Shirt with Shoulder Tabs' })).toBe(false);
    expect(productMatchesDressFilter({ name: 'Ladies No Sleeve Softshell Jacket RUSSELL' })).toBe(false);
    expect(productMatchesDressFilter({
      name: 'Softshell Vest',
      details: 'ensures your crew is dressed to impress',
    })).toBe(false);
  });
});

describe('productMatchesBodyType', () => {
  it('shows mens and unisex for male model, not ladies', () => {
    expect(productMatchesBodyType({ name: "Men's Chino Bermuda", fit: ['man'] }, 'man')).toBe(true);
    expect(productMatchesBodyType({ name: 'Unisex Chef Trousers', fit: ['woman', 'man'] }, 'man')).toBe(true);
    expect(productMatchesBodyType({ name: 'Ladies Quick Dry Bermuda', fit: ['woman'] }, 'man')).toBe(false);
    expect(productMatchesBodyType({ name: 'Ladies Quick Dry Bermuda', fit: ['woman', 'man'] }, 'man')).toBe(false);
  });

  it('shows ladies and unisex for female model, not mens-only', () => {
    expect(productMatchesBodyType({ name: 'Ladies V-Neck Pique T-Shirt', fit: ['woman'] }, 'woman')).toBe(true);
    expect(productMatchesBodyType({ name: 'Unisex Chef Trousers', fit: ['woman', 'man'] }, 'woman')).toBe(true);
    expect(productMatchesBodyType({ name: "Men's Chino Bermuda", fit: ['man'] }, 'woman')).toBe(false);
    expect(productMatchesBodyType({ name: "Men's Chino Bermuda", fit: ['woman', 'man'] }, 'woman')).toBe(false);
  });

  it('treats dresses as womens even when fit is mis-tagged', () => {
    const dress = { name: 'Straight Dress Kariban Premium', category: 'dresses', fit: ['woman', 'man'] };
    expect(resolveProductFit(dress)).toEqual(['woman']);
    expect(productMatchesBodyType(dress, 'man')).toBe(false);
  });

  it('excludes mens items with wrong fit data for female model', () => {
    const bad = {
      name: "Men's Chino Bermuda",
      fit: ['woman', 'man'],
      productUrl: 'https://www.marinayachtwear.com/products/mens-chino-bermuda-kariban',
    };
    expect(productMatchesBodyType(bad, 'woman')).toBe(false);
    expect(productMatchesBodyType(bad, 'female')).toBe(false);
    expect(productMatchesBodyType(bad, 'man')).toBe(true);
  });

  it('detects mens fit from sku or url when name is generic', () => {
    const bad = {
      name: 'Chino Bermuda',
      sku: 'mens-chino-bermuda-kariban',
      fit: ['woman', 'man'],
    };
    expect(productMatchesBodyType(bad, 'woman')).toBe(false);
    expect(productMatchesBodyType(bad, 'man')).toBe(true);
  });
});

describe('defaultProducts categories', () => {
  it('includes every imported supplier catalog in defaultProducts', () => {
    expect(importedSupplierCatalog).toHaveLength(IMPORTED_SUPPLIER_IDS.length);
    for (const entry of importedSupplierCatalog) {
      const raw = supplierCatalogExports.find((s) => s.id === entry.id)?.products || [];
      expect(entry.count, `${entry.name} missing from defaultProducts`).toBeGreaterThan(0);
      expect(entry.count, `${entry.name} lost products during import`).toBeLessThanOrEqual(raw.length);
    }
    const expectedTotal = importedSupplierCatalog.reduce((sum, s) => sum + s.count, 0);
    expect(defaultProducts).toHaveLength(expectedTotal);
  });

  it('includes Smallwoods Yachtwear supplier catalog', () => {
    const smallwoods = defaultProducts.filter(
      (p) => p.supplierName?.includes('Smallwood') || p.id?.startsWith('sw-'),
    );
    expect(smallwoods.length).toBeGreaterThanOrEqual(40);
  });

  it('assigns every marina product a consistent category', () => {
    const issues = [];
    for (const product of marinaDefaultProducts) {
      const expected = guessCategory(product.name, product.details || '');
      if (product.category !== expected) {
        issues.push(`${product.name}: stored ${product.category}, expected ${expected}`);
      }
      if (product.category === 'dresses' && !productMatchesDressFilter(product)) {
        issues.push(`${product.name}: dresses category but not a one-piece dress`);
      }
      if (/\bdress\s*shirt\b/i.test(product.name) && product.category !== 'shirts') {
        issues.push(`${product.name}: dress shirt not in shirts`);
      }
      if (/\bepaulettes?\b/i.test(product.name) && product.category !== 'epaulettes') {
        issues.push(`${product.name}: epaulettes product not in epaulettes`);
      }
    }
    expect(issues).toEqual([]);
  });
});
