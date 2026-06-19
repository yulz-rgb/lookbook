import { describe, it, expect } from 'vitest';
import {
  normalizeLookItems,
  crewEligibleForItem,
  itemBaseQty,
  itemOrderQty,
  slugifyRoleId,
} from './lookAllocation';

const productsById = {
  polo: { id: 'polo', roleTags: ['deck'] },
};

describe('lookAllocation', () => {
  it('normalizes product ids into allocation items', () => {
    const look = normalizeLookItems({ id: 'l1', productIds: ['polo'] }, productsById);
    expect(look.items).toHaveLength(1);
    expect(look.items[0].unitsPerPerson).toBe(1);
    expect(look.items[0].roleIds).toEqual(['deck']);
  });

  it('counts only crew assigned to the look and selected roles', () => {
    const look = { id: 'l1', bodyType: 'woman', items: [{ productId: 'polo', unitsPerPerson: 2, roleIds: ['deck'], spareQty: 1 }] };
    const crew = [
      { id: '1', role: 'deck', bodyType: 'woman', assignedLooks: ['l1'], setsPerCrew: 2 },
      { id: '2', role: 'chef', bodyType: 'woman', assignedLooks: ['l1'], setsPerCrew: 2 },
    ];
    const item = look.items[0];
    expect(crewEligibleForItem(crew[0], look, item)).toBe(true);
    expect(crewEligibleForItem(crew[1], look, item)).toBe(false);
    expect(itemBaseQty(crew, look, item, { setsPerCrew: 1 })).toBe(4);
    expect(itemOrderQty(crew, look, item, { setsPerCrew: 1 })).toBe(5);
  });

  it('slugifies custom role labels', () => {
    expect(slugifyRoleId('Bosun / Lead Deck')).toBe('bosun-lead-deck');
  });
});
