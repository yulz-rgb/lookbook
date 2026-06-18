import { describe, it, expect } from 'vitest';
import { productMatchesNav, catalogNavForProduct, navCategories } from './catalog.js';

describe('productMatchesNav', () => {
  const bridge = navCategories.find((n) => n.id === 'bridge');
  const footwear = navCategories.find((n) => n.id === 'footwear');

  it('shows untagged products in department navs', () => {
    const polo = { category: 'tops', roleTags: [] };
    expect(productMatchesNav(polo, bridge)).toBe(true);
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
