// Seed a demo yacht from lib/catalog.js. This is BOOTSTRAP data only and is
// clearly labelled as demo until replaced with real supplier data.
// Usage: DATABASE_URL=... node prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
import {
  defaultProducts,
  defaultLooks,
  defaultCrew,
} from '../lib/catalog.js';

const prisma = new PrismaClient();
const DEMO_SLUG = 'demo-yacht';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed.');
  }

  const yacht = await prisma.yacht.upsert({
    where: { slug: DEMO_SLUG },
    update: {},
    create: {
      name: 'Demo Yacht (sample data)',
      slug: DEMO_SLUG,
      settings: {
        create: {
          vessel: 'M/Y OCEAN BREEZE',
          priceNote: 'Demo prices only — replace with current supplier quotes before ordering.',
        },
      },
    },
  });

  // Reset demo content so re-seeding is idempotent.
  await prisma.lookItem.deleteMany({ where: { look: { yachtId: yacht.id } } });
  await prisma.crewMember.deleteMany({ where: { yachtId: yacht.id } });
  await prisma.look.deleteMany({ where: { yachtId: yacht.id } });
  await prisma.product.deleteMany({ where: { yachtId: yacht.id } });

  const skuToId = new Map();
  const legacyIdToId = new Map();
  for (let i = 0; i < defaultProducts.length; i += 1) {
    const p = defaultProducts[i];
    const created = await prisma.product.create({
      data: {
        yachtId: yacht.id,
        category: p.category,
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        price: p.price,
        currency: 'EUR',
        colours: p.colours || [],
        swatch: p.swatch,
        accent: p.accent,
        fabric: p.fabric,
        details: p.details,
        fit: p.fit || ['woman', 'man'],
        roleTags: p.roleTags || [],
        leadTime: p.leadTime,
        minOrder: p.minOrder ?? 1,
        sizeRange: p.sizeRange,
        imageHint: p.imageHint || 'polo',
        sortIndex: i,
      },
    });
    skuToId.set(p.sku, created.id);
    legacyIdToId.set(p.id, created.id);
  }

  const lookLegacyToId = new Map();
  for (let i = 0; i < defaultLooks.length; i += 1) {
    const l = defaultLooks[i];
    const created = await prisma.look.create({
      data: {
        yachtId: yacht.id,
        name: l.name,
        description: l.description,
        bodyType: l.bodyType,
        sortIndex: i,
        items: {
          create: (l.productIds || [])
            .map((pid) => legacyIdToId.get(pid))
            .filter(Boolean)
            .map((productId) => ({ productId })),
        },
      },
    });
    lookLegacyToId.set(l.id, created.id);
  }

  for (let i = 0; i < defaultCrew.length; i += 1) {
    const c = defaultCrew[i];
    await prisma.crewMember.create({
      data: {
        yachtId: yacht.id,
        name: c.name,
        role: c.role,
        bodyType: c.bodyType,
        topSize: c.topSize,
        bottomSize: c.bottomSize,
        shoeSize: c.shoeSize,
        assignedLookId: lookLegacyToId.get(c.assignedLook) || null,
        sortIndex: i,
      },
    });
  }

  console.log(
    `Seeded demo yacht "${yacht.name}" with ${defaultProducts.length} products, ${defaultLooks.length} looks, ${defaultCrew.length} crew.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
