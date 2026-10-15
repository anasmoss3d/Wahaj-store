import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["dashboard:read", "View admin dashboard"],
  ["products:manage", "Manage products, colors, categories, add-ons, images, and reviews"],
  ["orders:manage", "Manage orders and order statuses"],
  ["marketing:manage", "Manage coupons and promotions"],
  ["settings:manage", "Manage store settings and shipping rates"],
  ["admins:manage", "Manage admin users and roles"],
  ["audit:read", "Read audit log"]
] as const;

const categories = [
  ["Trays", "trays", "Concrete trays and hosting sets."],
  ["Vases", "vases", "Handmade concrete vases and sculptural pieces."],
  ["Organizers", "organizers", "Vanity and desk organizers."],
  ["Candle Holders", "candle-holders", "Soft light pieces for home corners."],
  ["Custom Products", "custom-products", "Made-to-order color and decoration work."]
] as const;

const colors = [
  ["Concrete Gray", "#9b948b", 0],
  ["Warm White", "#f5f0e8", 1],
  ["Charcoal Black", "#171412", 2],
  ["Soft Beige", "#d8c4aa", 3],
  ["Blush Pink", "#d9a7b2", 4],
  ["Custom Color", "#187d6d", 5]
] as const;

const addons = [
  ["Gold Leaf", "Hand-applied gold leaf details.", 30, "/seed/black-luxury-set.jpg", 0],
  ["Silver Leaf", "Silver leaf texture and rim details.", 25, "/seed/pearl-silver-set.jpg", 1],
  ["Decorative Stones", "Crystal-like stone detailing.", 35, "/seed/pearl-silver-set.jpg", 2],
  ["Custom Decoration", "Special decoration notes reviewed by admin.", 50, "/seed/white-tray-set.jpg", 3]
] as const;

async function main() {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: { description: "Full access" },
    create: { name: "Super Admin", description: "Full access" }
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id
      }
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@wahaj.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      roleId: superAdminRole.id,
      active: true
    },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || "Wahaj Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      roleId: superAdminRole.id
    }
  });

  const categoryRows = new Map<string, string>();
  for (const [name, slug, description] of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, description, active: true },
      create: { name, slug, description, active: true }
    });
    categoryRows.set(slug, category.id);
  }

  const colorRows = new Map<string, string>();
  for (const [name, hexCode, sortOrder] of colors) {
    const color = await prisma.color.create({
      data: { name, hexCode, sortOrder, active: true }
    });
    colorRows.set(name, color.id);
  }

  const addonRows = new Map<string, string>();
  for (const [name, description, price, imageUrl, sortOrder] of addons) {
    const addon = await prisma.addon.create({
      data: {
        name,
        description,
        price: new Prisma.Decimal(price),
        imageUrl,
        sortOrder,
        active: true
      }
    });
    addonRows.set(name, addon.id);
  }

  await prisma.cartItemAddon.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();

  const productData = [
    {
      name: "Wahaj White Hosting Tray",
      slug: "wahaj-white-hosting-tray",
      description:
        "A white concrete hosting tray set with sculptural decor, flower vase, and a warm house accent. Designed for entry tables and gifting.",
      basePrice: 780,
      categorySlug: "trays",
      mainImage: "/seed/white-tray-set.jpg",
      sku: "WAH-TRAY-WHITE-001",
      stockQuantity: 12,
      featured: true,
      bestSeller: true,
      variants: [
        ["Warm White", 0, "/seed/white-tray-set.jpg"],
        ["Soft Beige", 15, "/seed/white-tray-set.jpg"],
        ["Custom Color", 25, "/seed/white-tray-set.jpg"]
      ],
      addOns: ["Gold Leaf", "Silver Leaf", "Custom Decoration"]
    },
    {
      name: "Black Luxury Concrete Set",
      slug: "black-luxury-concrete-set",
      description:
        "A dramatic black set with metallic gold detailing, including tray, vase, lidded bowl, and accent dish.",
      basePrice: 950,
      categorySlug: "custom-products",
      mainImage: "/seed/black-luxury-set.jpg",
      sku: "WAH-LUX-BLK-002",
      stockQuantity: 8,
      featured: true,
      bestSeller: true,
      variants: [
        ["Charcoal Black", 0, "/seed/black-luxury-set.jpg"],
        ["Warm White", 20, "/seed/pearl-silver-set.jpg"],
        ["Custom Color", 35, "/seed/black-luxury-set.jpg"]
      ],
      addOns: ["Gold Leaf", "Decorative Stones", "Custom Decoration"]
    },
    {
      name: "Blush Vanity Organizer",
      slug: "blush-vanity-organizer",
      description:
        "A blush pink vanity organizer set for brushes, cosmetics, cotton pads, accessories, and daily essentials.",
      basePrice: 620,
      categorySlug: "organizers",
      mainImage: "/seed/pink-organizer-set.jpg",
      sku: "WAH-ORG-PINK-003",
      stockQuantity: 15,
      featured: true,
      bestSeller: false,
      variants: [
        ["Blush Pink", 0, "/seed/pink-organizer-set.jpg"],
        ["Warm White", 15, "/seed/white-tray-set.jpg"],
        ["Custom Color", 25, "/seed/pink-organizer-set.jpg"]
      ],
      addOns: ["Gold Leaf", "Custom Decoration"]
    },
    {
      name: "Pearl Silver Decor Set",
      slug: "pearl-silver-decor-set",
      description:
        "Pearl-toned concrete decor with silver leaf and stone texture details for a light luxury finish.",
      basePrice: 890,
      categorySlug: "vases",
      mainImage: "/seed/pearl-silver-set.jpg",
      sku: "WAH-PEARL-SLV-004",
      stockQuantity: 10,
      featured: true,
      bestSeller: true,
      variants: [
        ["Warm White", 0, "/seed/pearl-silver-set.jpg"],
        ["Concrete Gray", 0, "/seed/pearl-silver-set.jpg"],
        ["Custom Color", 30, "/seed/pearl-silver-set.jpg"]
      ],
      addOns: ["Silver Leaf", "Decorative Stones"]
    },
    {
      name: "Minimal Concrete Tray",
      slug: "minimal-concrete-tray",
      description:
        "A minimal tray for candles, perfumes, and entryway styling. Built as a flexible sample with all dashboard-managed colors.",
      basePrice: 350,
      categorySlug: "trays",
      mainImage: "/seed/white-tray-set.jpg",
      sku: "WAH-TRAY-MIN-005",
      stockQuantity: 24,
      featured: false,
      bestSeller: false,
      variants: [
        ["Concrete Gray", 0, "/seed/white-tray-set.jpg"],
        ["Warm White", 15, "/seed/white-tray-set.jpg"],
        ["Charcoal Black", 15, "/seed/black-luxury-set.jpg"],
        ["Soft Beige", 15, "/seed/white-tray-set.jpg"]
      ],
      addOns: ["Gold Leaf", "Silver Leaf", "Decorative Stones"]
    }
  ];

  for (const [index, product] of productData.entries()) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: new Prisma.Decimal(product.basePrice),
        categoryId: categoryRows.get(product.categorySlug)!,
        mainImage: product.mainImage,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        active: true,
        featured: product.featured,
        bestSeller: product.bestSeller,
        sortOrder: index,
        seoTitle: `${product.name} | Wahaj`,
        metaDescription: product.description.slice(0, 155),
        images: {
          create: [
            { url: product.mainImage, alt: product.name, kind: "MAIN", sortOrder: 0 },
            { url: "/seed/white-tray-set.jpg", alt: `${product.name} white view`, sortOrder: 1 },
            { url: "/seed/black-luxury-set.jpg", alt: `${product.name} black view`, sortOrder: 2 }
          ]
        },
        colors: {
          create: product.variants.map((variant, variantIndex) => {
            const [colorName, additionalPrice, imageUrl] = variant as [string, number, string];
            return {
              colorId: colorRows.get(colorName)!,
              additionalPrice: new Prisma.Decimal(additionalPrice),
              imageUrl,
              active: true,
              sortOrder: variantIndex
            };
          })
        },
        addons: {
          create: product.addOns.map((addonName, addonIndex) => ({
            addonId: addonRows.get(addonName)!,
            active: true,
            sortOrder: addonIndex
          }))
        }
      }
    });
  }

  const settings = {
    shippingFlatRate: 65,
    freeShippingThreshold: 1500,
    whatsappNumber: "+201000000000",
    primaryColor: "#187d6d",
    secondaryColor: "#c7924d",
    heroImage: "/seed/black-luxury-set.jpg",
    contactEmail: "hello@wahaj.local",
    instapayHandle: "anasmoss3d@instapay",
    instapayQrImage: "",
    instapayLink: "https://ipn.eg/S/anasmoss3d/instapay/4PjSoL",
    telegramChatId: ""
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  const governorateRates: Array<[string, number]> = [
    ["Cairo", 65],
    ["Giza", 65],
    ["Qalyubia", 70],
    ["Alexandria", 80],
    ["Dakahlia", 80],
    ["Sharqia", 80],
    ["Port Said", 90],
    ["Suez", 90],
    ["Ismailia", 90],
    ["Aswan", 110],
    ["Luxor", 100]
  ];
  for (const [governorate, rate] of governorateRates) {
    await prisma.shippingRate.upsert({
      where: { governorate },
      update: { rate: new Prisma.Decimal(rate), active: true },
      create: { governorate, rate: new Prisma.Decimal(rate), active: true }
    });
  }

  const coupons: Array<{
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    minSubtotal: number;
    maxUses: number | null;
  }> = [
    { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 200, maxUses: 500 },
    { code: "WAHAJ50", type: "FIXED", value: 50, minSubtotal: 600, maxUses: 200 }
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: new Prisma.Decimal(coupon.value),
        minSubtotal: new Prisma.Decimal(coupon.minSubtotal),
        maxUses: coupon.maxUses,
        active: true
      },
      create: {
        code: coupon.code,
        type: coupon.type,
        value: new Prisma.Decimal(coupon.value),
        minSubtotal: new Prisma.Decimal(coupon.minSubtotal),
        maxUses: coupon.maxUses,
        active: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
