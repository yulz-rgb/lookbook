import { describe, it, expect } from 'vitest';
import {
  productMatchesNav,
  catalogNavForProduct,
  navCategories,
  productMatchesBodyType,
  resolveProductFit,
} from './catalog.js';

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
});
