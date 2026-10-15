import { CouponType, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";

const phoneRegex = /^(\+?2)?01[0125][0-9]{8}$/;
const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const idSchema = z.string().min(8).max(64);

export const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(8).max(200)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().regex(phoneRegex, "Enter a valid Egyptian mobile number."),
  email: z.string().email().max(190).optional().or(z.literal("")),
  password: z.string().min(8).max(200)
});

export const addToCartSchema = z.object({
  productId: idSchema,
  productColorId: idSchema,
  productAddonIds: z.array(idSchema).max(12).default([]),
  quantity: z.number().int().min(1).max(99)
});

export const cartQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(99)
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  phone: z.string().regex(phoneRegex, "Enter a valid Egyptian mobile number."),
  whatsapp: z.string().regex(phoneRegex).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  governorate: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  fullAddress: z.string().min(8).max(500),
  building: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  paymentMethod: z.nativeEnum(PaymentMethod).default("CASH_ON_DELIVERY")
});

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(160),
  description: z.string().max(400).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const colorInputSchema = z.object({
  name: z.string().min(2).max(80),
  hexCode: z.string().regex(hexRegex),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const addonInputSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(999999),
  imageUrl: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const adminProductSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180),
  description: z.string().min(12).max(4000),
  basePrice: z.coerce.number().min(1).max(999999),
  categoryId: idSchema,
  mainImage: z.string().min(1).max(500),
  sku: z.string().min(2).max(80),
  stockQuantity: z.coerce.number().int().min(0).max(999999),
  active: z.boolean().default(false),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  seoTitle: z.string().max(180).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  gallery: z
    .array(
      z.object({
        url: z.string().min(1).max(500),
        alt: z.string().max(180).optional().or(z.literal("")),
        sortOrder: z.coerce.number().int().default(0)
      })
    )
    .default([]),
  colors: z
    .array(
      z.object({
        colorId: idSchema,
        additionalPrice: z.coerce.number().min(0).max(999999),
        imageUrl: z.string().min(1).max(500),
        active: z.boolean().default(true),
        sortOrder: z.coerce.number().int().default(0)
      })
    )
    .min(1),
  addonIds: z.array(idSchema).default([])
});

export const orderStatusInputSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional().or(z.literal(""))
});

const optionalDate = z
  .string()
  .max(40)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? new Date(value) : undefined));

export const couponInputSchema = z
  .object({
    code: z.string().min(3).max(24),
    type: z.nativeEnum(CouponType),
    value: z.coerce.number().min(0.01).max(999999),
    minSubtotal: z.coerce.number().min(0).max(999999).default(0),
    maxUses: z.coerce.number().int().min(1).max(1000000).optional().or(z.literal("")),
    active: z.boolean().default(true),
    startsAt: optionalDate,
    endsAt: optionalDate
  })
  .refine((data) => (data.type === "PERCENT" ? data.value <= 100 : true), {
    message: "Percent coupons cannot exceed 100.",
    path: ["value"]
  });

export const couponApplySchema = z.object({
  code: z.string().min(1).max(32)
});

export const shippingRateInputSchema = z.object({
  governorate: z.string().min(2).max(80),
  rate: z.coerce.number().min(0).max(999999),
  active: z.boolean().default(true)
});

export const reviewInputSchema = z.object({
  productId: idSchema,
  name: z.string().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(4).max(1000)
});

export const wishlistInputSchema = z.object({
  productId: idSchema
});

export const orderCustomerEditSchema = z.object({
  customerName: z.string().min(2).max(120),
  phone: z.string().regex(phoneRegex, "Enter a valid Egyptian mobile number."),
  whatsapp: z.string().regex(phoneRegex).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  governorate: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  fullAddress: z.string().min(8).max(500),
  building: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  internalNotes: z.string().max(1000).optional().or(z.literal(""))
});

export const orderItemEditSchema = z.object({
  itemId: idSchema,
  quantity: z.coerce.number().int().min(0).max(99)
});

export const storeSettingsSchema = z.object({
  shippingFlatRate: z.coerce.number().min(0).max(999999),
  freeShippingThreshold: z.coerce.number().min(0).max(999999).default(0),
  whatsappNumber: z.string().max(40).optional().or(z.literal("")),
  instapayHandle: z.string().max(120).optional().or(z.literal("")),
  instapayQrImage: z.string().max(500).optional().or(z.literal("")),
  instapayLink: z.string().url().max(500).optional().or(z.literal("")),
  telegramChatId: z.string().max(64).optional().or(z.literal("")),
  primaryColor: z.string().regex(hexRegex),
  secondaryColor: z.string().regex(hexRegex),
  heroImage: z.string().max(500).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal(""))
});
