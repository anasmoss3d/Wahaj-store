export const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Faiyum",
  "Gharbia",
  "Ismailia",
  "Menofia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Asyut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharqia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag"
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export const governorateLabels: Record<Governorate, { ar: string; en: string }> = {
  Cairo: { ar: "القاهرة", en: "Cairo" },
  Giza: { ar: "الجيزة", en: "Giza" },
  Alexandria: { ar: "الإسكندرية", en: "Alexandria" },
  Dakahlia: { ar: "الدقهلية", en: "Dakahlia" },
  "Red Sea": { ar: "البحر الأحمر", en: "Red Sea" },
  Beheira: { ar: "البحيرة", en: "Beheira" },
  Faiyum: { ar: "الفيوم", en: "Faiyum" },
  Gharbia: { ar: "الغربية", en: "Gharbia" },
  Ismailia: { ar: "الإسماعيلية", en: "Ismailia" },
  Menofia: { ar: "المنوفية", en: "Menofia" },
  Minya: { ar: "المنيا", en: "Minya" },
  Qalyubia: { ar: "القليوبية", en: "Qalyubia" },
  "New Valley": { ar: "الوادي الجديد", en: "New Valley" },
  Suez: { ar: "السويس", en: "Suez" },
  Aswan: { ar: "أسوان", en: "Aswan" },
  Asyut: { ar: "أسيوط", en: "Asyut" },
  "Beni Suef": { ar: "بني سويف", en: "Beni Suef" },
  "Port Said": { ar: "بورسعيد", en: "Port Said" },
  Damietta: { ar: "دمياط", en: "Damietta" },
  Sharqia: { ar: "الشرقية", en: "Sharqia" },
  "South Sinai": { ar: "جنوب سيناء", en: "South Sinai" },
  "Kafr El Sheikh": { ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  Matrouh: { ar: "مطروح", en: "Matrouh" },
  Luxor: { ar: "الأقصر", en: "Luxor" },
  Qena: { ar: "قنا", en: "Qena" },
  "North Sinai": { ar: "شمال سيناء", en: "North Sinai" },
  Sohag: { ar: "سوهاج", en: "Sohag" }
};

export function isGovernorate(value: string): value is Governorate {
  return (GOVERNORATES as readonly string[]).includes(value);
}

export function governorateLabel(value: string, locale: "ar" | "en"): string {
  if (isGovernorate(value)) {
    return governorateLabels[value][locale];
  }
  return value;
}
