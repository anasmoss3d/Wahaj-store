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

export function isGovernorate(value: string): value is Governorate {
  return (GOVERNORATES as readonly string[]).includes(value);
}
