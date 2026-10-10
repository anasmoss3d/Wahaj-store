import { prisma } from "@/lib/db";

export type StoreSettings = {
  shippingFlatRate: number;
  whatsappNumber: string;
  primaryColor: string;
  secondaryColor: string;
  heroImage: string;
  contactEmail: string;
};

export const defaultStoreSettings: StoreSettings = {
  shippingFlatRate: 65,
  whatsappNumber: "+201000000000",
  primaryColor: "#187d6d",
  secondaryColor: "#c7924d",
  heroImage: "/seed/black-luxury-set.jpg",
  contactEmail: "hello@wahaj.local"
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.storeSetting.findMany();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    shippingFlatRate:
      typeof values.shippingFlatRate === "number"
        ? values.shippingFlatRate
        : defaultStoreSettings.shippingFlatRate,
    whatsappNumber:
      typeof values.whatsappNumber === "string"
        ? values.whatsappNumber
        : defaultStoreSettings.whatsappNumber,
    primaryColor:
      typeof values.primaryColor === "string"
        ? values.primaryColor
        : defaultStoreSettings.primaryColor,
    secondaryColor:
      typeof values.secondaryColor === "string"
        ? values.secondaryColor
        : defaultStoreSettings.secondaryColor,
    heroImage:
      typeof values.heroImage === "string" ? values.heroImage : defaultStoreSettings.heroImage,
    contactEmail:
      typeof values.contactEmail === "string"
        ? values.contactEmail
        : defaultStoreSettings.contactEmail
  };
}

export async function upsertStoreSettings(settings: StoreSettings) {
  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.storeSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    )
  );
}
