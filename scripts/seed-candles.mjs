import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding candles...');
  let candleCat = await prisma.category.findUnique({ where: { slug: 'candles' } });
  if (!candleCat) {
    candleCat = await prisma.category.create({
      data: {
        name: 'Candles',
        slug: 'candles',
        description: 'Handmade 100% natural soy wax candles with pure botanical fragrances.',
        active: true,
        sortOrder: 0
      }
    });
  }

  const candles = [
    {
      name: 'Cedar Hour Soy Candle',
      slug: 'cedar-hour',
      description: 'NO. 01 — Warm cedarwood, sun-dried fig leaves, and a soft curl of sweet woodsmoke in an amber glass jar.',
      basePrice: new Prisma.Decimal(240),
      mainImage: '/products/cedar-hour.jpg',
      sku: 'WAH-CNDL-CDR-008',
      stockQuantity: 20,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 0
    },
    {
      name: 'After Rain Soy Candle',
      slug: 'after-rain',
      description: 'NO. 02 — Crisp coastal rainwater, wild rosemary sprigs, and cool wet stone in a smoky gray glass jar.',
      basePrice: new Prisma.Decimal(240),
      mainImage: '/products/after-rain.jpg',
      sku: 'WAH-CNDL-ARN-009',
      stockQuantity: 20,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 1
    },
    {
      name: 'Citrus Sunday Soy Candle',
      slug: 'citrus-sunday',
      description: 'NO. 03 — Bright blood orange pulp, radiant Italian neroli blossoms, and fresh crushed green leaves in a white ceramic tumbler.',
      basePrice: new Prisma.Decimal(260),
      mainImage: '/products/citrus-sunday.jpg',
      sku: 'WAH-CNDL-CTR-010',
      stockQuantity: 20,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 2
    },
    {
      name: 'Wahaj Sandalwood & Amber Soy Candle',
      slug: 'wahaj-sandalwood-amber-candle',
      description: 'Our signature candle poured with 100% pure soy wax, rich Australian sandalwood, and warm golden amber in a heavy clear glass tumbler.',
      basePrice: new Prisma.Decimal(280),
      mainImage: '/brand/hero-candle.jpg',
      sku: 'WAH-CNDL-SAN-001',
      stockQuantity: 25,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 0
    },
    {
      name: 'Pine Needle + Cold Mint Candle',
      slug: 'pine-needle-cold-mint-candle',
      description: 'Crisp evergreen pine needles paired with brisk cold garden mint. Invigorating and clarifying.',
      basePrice: new Prisma.Decimal(220),
      mainImage: '/candles/space-candle.webp',
      sku: 'WAH-CNDL-PIN-002',
      stockQuantity: 20,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 1
    },
    {
      name: 'Eucalyptus + White Sage Candle',
      slug: 'eucalyptus-white-sage-candle',
      description: 'Purifying wild white sage softened with fresh crushed eucalyptus leaves. A calming sanctuary scent.',
      basePrice: new Prisma.Decimal(240),
      mainImage: '/brand/vignette-top.jpg',
      sku: 'WAH-CNDL-EUC-003',
      stockQuantity: 18,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 2
    },
    {
      name: 'Lemongrass + Green Tea Candle',
      slug: 'lemongrass-green-tea-candle',
      description: 'Bright steamed green sencha tea elevated with sun-drenched lemongrass and a whisper of cedar.',
      basePrice: new Prisma.Decimal(220),
      mainImage: '/brand/vignette-bottom.jpg',
      sku: 'WAH-CNDL-LEM-004',
      stockQuantity: 15,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 3
    },
    {
      name: 'Wild Basil + Tomato Vine Candle',
      slug: 'wild-basil-tomato-vine-candle',
      description: 'Sun-warmed tomato vine, freshly picked sweet basil leaves, and dewy summer earth.',
      basePrice: new Prisma.Decimal(230),
      mainImage: '/candles/space-candle.webp',
      sku: 'WAH-CNDL-BAS-005',
      stockQuantity: 14,
      active: true,
      featured: true,
      bestSeller: false,
      sortOrder: 4
    },
    {
      name: 'Eucalyptus + Sea Salt Candle',
      slug: 'eucalyptus-sea-salt-candle',
      description: 'Coastal sea salt crystals mingled with aromatic eucalyptus breeze and driftwood.',
      basePrice: new Prisma.Decimal(220),
      mainImage: '/brand/hero-candle.jpg',
      sku: 'WAH-CNDL-SLT-006',
      stockQuantity: 22,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 5
    },
    {
      name: 'Strawberry Milk Candle | شمعة الفراولة باللبن',
      slug: 'strawberry-milk-candle',
      description: 'A comforting, creamy blend of sweet ripe strawberries, warm steamed milk, and vanilla bean.',
      basePrice: new Prisma.Decimal(230),
      mainImage: '/candles/strawberry-milk-candle.webp',
      sku: 'WAH-CNDL-STR-007',
      stockQuantity: 12,
      active: true,
      featured: true,
      bestSeller: true,
      sortOrder: 6
    }
  ];

  for (const c of candles) {
    await prisma.product.upsert({
      where: { slug: c.slug },
      update: {
        ...c,
        categoryId: candleCat.id
      },
      create: {
        ...c,
        categoryId: candleCat.id
      }
    });
  }

  console.log('Seeded candles count:', candles.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
