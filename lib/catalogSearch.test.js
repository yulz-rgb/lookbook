import { describe, it, expect } from 'vitest';
import {
  productMatchesSearch,
  productSearchText,
  searchPlatform,
  searchProducts,
  searchLooks,
  searchCrew,
} from './catalogSearch.js';

const sampleProduct = {
  id: 'test-polo',
  name: 'Ladies Luxury Stretch Polo',
  brand: 'Marina Yachting',
  supplierName: 'Marina Yachting',
  category: 'tops',
  fabric: '95% cotton 5% elastane',
  details: 'Breathable deck polo for hot days',
  colours: ['White', 'Navy'],
  roleTags: ['deck', 'interior'],
  sizeRange: 'XS–XL',
  active: true,
};

describe('productMatchesSearch', () => {
  it('matches name, brand, and supplier', () => {
    expect(productMatchesSearch(sampleProduct, 'luxury stretch')).toBe(true);
    expect(productMatchesSearch(sampleProduct, 'marina')).toBe(true);
    expect(productMatchesSearch(sampleProduct, 'unknown brand')).toBe(false);
  });

  it('matches fabric, details, colours, and role tags', () => {
    expect(productMatchesSearch(sampleProduct, 'elastane')).toBe(true);
    expect(productMatchesSearch(sampleProduct, 'breathable')).toBe(true);
    expect(productMatchesSearch(sampleProduct, 'navy')).toBe(true);
    expect(productMatchesSearch(sampleProduct, 'deck')).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(productMatchesSearch(sampleProduct, '')).toBe(true);
    expect(productMatchesSearch(sampleProduct, '   ')).toBe(true);
  });

  it('ignores inactive products in searchProducts', () => {
    const inactive = { ...sampleProduct, id: 'inactive', active: false };
    expect(searchProducts([sampleProduct, inactive], 'luxury')).toHaveLength(1);
  });
});

describe('searchPlatform', () => {
  const looks = [{ id: 'arrival', name: 'Arrival / Guest Meet', description: 'Dockside welcome' }];
  const crew = [{ id: 'c1', name: 'Emma Walsh', role: 'chief-stew', topSize: 'M' }];
  const orderHistory = [{ id: 'o1', name: 'Summer 2026 order', status: 'APPROVED' }];

  it('groups results by entity type', () => {
    const results = searchPlatform({
      products: [sampleProduct],
      looks,
      crew,
      orderHistory,
      query: 'arrival',
    });
    expect(results.looks).toHaveLength(1);
    expect(results.looks[0].label).toBe('Arrival / Guest Meet');
  });

  it('finds crew by name', () => {
    const results = searchPlatform({ products: [], looks: [], crew, orderHistory, query: 'emma' });
    expect(results.crew).toHaveLength(1);
    expect(results.crew[0].label).toBe('Emma Walsh');
  });

  it('returns empty groups for blank query', () => {
    const results = searchPlatform({ products: [sampleProduct], looks, crew, orderHistory, query: '' });
    expect(results.total).toBe(0);
  });
});

describe('productSearchText', () => {
  it('includes extended product fields', () => {
    const text = productSearchText(sampleProduct);
    expect(text).toContain('elastane');
    expect(text).toContain('deck');
    expect(text).toContain('xs–xl');
  });
});

describe('searchLooks and searchCrew', () => {
  it('searches look descriptions', () => {
    const looks = [{ id: 'l1', name: 'Day Deck', description: 'Washdown outfit' }];
    expect(searchLooks(looks, 'washdown')).toHaveLength(1);
  });

  it('searches crew roles and sizes', () => {
    const crew = [{ id: 'c1', name: 'Alex', role: 'deck', topSize: 'L' }];
    expect(searchCrew(crew, 'deck')).toHaveLength(1);
    expect(searchCrew(crew, 'top l')).toHaveLength(1);
  });
});
