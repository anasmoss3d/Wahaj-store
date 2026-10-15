import { cache } from "react";
import { prisma } from "@/lib/db";

export type StoreSettings = {
  shippingFlatRate: number;
  freeShippingThreshold: number;
  whatsappNumber: string;
  primaryColor: string;
  secondaryColor: string;
  heroImage: string;
  contactEmail: string;
  instapayHandle: string;
  instapayQrImage: string;
  instapayLink: string;
  telegramChatId: string;
};

export const defaultStoreSettings: StoreSettings = {
  shippingFlatRate: 65,
  freeShippingThreshold: 1500,
  whatsappNumber: "+201000000000",
  primaryColor: "#187d6d",
  secondaryColor: "#c7924d",
  heroImage: "/seed/black-luxury-set.jpg",
  contactEmail: "hello@wahaj.local",
  instapayHandle: "",
  instapayQrImage: "",
  instapayLink: "",
  telegramChatId: ""
};

async function getStoreSettingsUncached(): Promise<StoreSettings> {
  const rows = await prisma.storeSetting.findMany();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    shippingFlatRate:
      typeof values.shippingFlatRate === "number"
        ? values.shippingFlatRate
        : defaultStoreSettings.shippingFlatRate,
    freeShippingThreshold:
      typeof values.freeShippingThreshold === "number"
        ? values.freeShippingThreshold
        : defaultStoreSettings.freeShippingThreshold,
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
        : defaultStoreSettings.contactEmail,
    instapayHandle:
      typeof values.instapayHandle === "string"
        ? values.instapayHandle
        : defaultStoreSettings.instapayHandle,
    instapayQrImage:
      typeof values.instapayQrImage === "string"
        ? values.instapayQrImage
        : defaultStoreSettings.instapayQrImage,
    instapayLink:
      typeof values.instapayLink === "string"
        ? values.instapayLink
        : defaultStoreSettings.instapayLink,
    telegramChatId:
      typeof values.telegramChatId === "string"
        ? values.telegramChatId
        : defaultStoreSettings.telegramChatId
  };
}

export const getStoreSettings = cache(getStoreSettingsUncached);

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
