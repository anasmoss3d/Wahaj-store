export const STORE_TIME_ZONE = "Africa/Cairo";

type DateInput = Date | string;

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(value: DateInput, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: STORE_TIME_ZONE
  }).format(toDate(value));
}

export function formatDate(value: DateInput, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    dateStyle: "medium",
    timeZone: STORE_TIME_ZONE
  }).format(toDate(value));
}

function cairoOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - date.getTime();
}

/** Midnight in Cairo for a YYYY-MM-DD string, returned as a UTC instant. */
export function cairoDayStart(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  return new Date(utcMidnight - cairoOffsetMs(new Date(utcMidnight)));
}

/** End of a Cairo day (YYYY-MM-DD) as a UTC instant. */
export function cairoDayEnd(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = Date.UTC(y, m - 1, d + 1);
  return new Date(next - cairoOffsetMs(new Date(next)) - 1);
}

/** YYYY-MM-DD key of the Cairo day containing this instant. */
export function cairoDayKey(date: DateInput) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(toDate(date))
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** WAH-YYYYMMDD prefix based on the current Cairo date. */
export function cairoOrderDatePrefix() {
  return `WAH-${cairoDayKey(new Date()).replaceAll("-", "")}`;
}
