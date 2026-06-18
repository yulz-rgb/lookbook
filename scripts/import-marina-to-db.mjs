#!/usr/bin/env node
/** Import bundled Marina catalog into every yacht in the database. */
import { PrismaClient } from '@prisma/client';
import { defaultProducts } from '../lib/catalog.js';
import { cleanFabricComposition } from '../lib/fabric.js';

const prisma = new PrismaClient();
const SUPPLIER_NAME = 'Marina Yacht Wear';

async function ensureSupplier(yachtId) {
  return prisma.supplier.upsert({
    where: { yachtId_name: { yachtId, name: SUPPLIER_NAME } },
    update: {},
    create: { yachtId, name: SUPPLIER_NAME },
  });
}

async function importYacht(yachtId) {
  const supplier = await ensureSupplier(yachtId);
  await prisma.lookItem.deleteMany({ where: { look: { yachtId } } });
  await prisma.product.deleteMany({ where: { yachtId } });

  let created = 0;
  for (let i = 0; i < defaultProducts.length; i += 1) {
    const p = defaultProducts[i];
    const colourImages = p.colourImages && Object.keys(p.colourImages).length ? p.colourImages : undefined;
    await prisma.product.create({
      data: {
        yachtId,
        supplierId: supplier.id,
        category: p.category,
        name: p.name,
        brand: p.brand || SUPPLIER_NAME,
        price: p.price,
        currency: p.currency === '€' ? 'EUR' : (p.currency || 'EUR'),
        colours: p.colours || [],
        swatch: p.swatch || '#ffffff',
        accent: p.accent || '#0b1f3a',
        fabric: cleanFabricComposition(p.fabric || ''),
        details: p.details || '',
        fit: p.fit || ['woman', 'man'],
        roleTags: p.roleTags || [],
        leadTime: p.leadTime || '',
        minOrder: p.minOrder ?? 1,
        sizeRange: p.sizeRange || '',
        imageHint: p.imageHint || 'polo',
        imageUrl: p.imageUrl || null,
        productUrl: p.productUrl || null,
        colourImages,
        active: p.active !== false,
        sortIndex: i,
      },
    });
    created += 1;
  }

  await prisma.importBatch.create({
    data: {
      yachtId,
      filename: 'marina-yacht-wear-catalog.csv',
      status: 'COMPLETED',
      createdCount: created,
      updatedCount: 0,
      skippedCount: 0,
    },
  });

  return created;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const yachts = await prisma.yacht.findMany({ select: { id: true, name: true, slug: true } });
  if (!yachts.length) {
    console.log('No yachts found — nothing to import.');
    return;
  }

  for (const yacht of yachts) {
    const count = await importYacht(yacht.id);
    console.log(`${yacht.name} (${yacht.slug}): ${count} products imported`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
