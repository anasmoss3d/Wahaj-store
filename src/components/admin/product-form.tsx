"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, ImageIcon, Package, Palette, Ruler, Search, Sparkles } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { interpolate } from "@/lib/admin-i18n";
import { cn, SKU_SUGGESTED, suggestedProductSku, suggestProductSlug } from "@/lib/utils";

type Option = {
  id: string;
  name: string;
  nameEn?: string | null;
  hexCode?: string;
  price?: string;
};

type ProductInitial = {
  id?: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  basePrice: string;
  categoryId: string;
  mainImage: string;
  sku: string;
  stockQuantity: number;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  sortOrder: number;
  seoTitle: string;
  seoTitleEn: string;
  metaDescription: string;
  metaDescriptionEn: string;
  canonicalUrl: string;
  gallery: Array<{ url: string; alt: string; altEn: string; sortOrder: number }>;
  colors: Array<{
    colorId: string;
    additionalPrice: string;
    imageUrl: string;
    active: boolean;
    sortOrder: number;
  }>;
  sizes: Array<{
    sizeId: string;
    price: string;
    active: boolean;
    sortOrder: number;
  }>;
  addonIds: string[];
};

function formatOptionLabel(option: Option, locale: "ar" | "en") {
  if (locale === "en" && option.nameEn) {
    return `${option.nameEn} (${option.name})`;
  }
  return option.nameEn ? `${option.name} (${option.nameEn})` : option.name;
}

const steps = [
  { key: "basic", icon: Package },
  { key: "images", icon: ImageIcon },
  { key: "colors", icon: Palette },
  { key: "sizes", icon: Ruler },
  { key: "addons", icon: Sparkles },
  { key: "seo", icon: Search },
  { key: "preview", icon: Eye }
] as const;

const emptyProduct: ProductInitial = {
  name: "",
  nameEn: "",
  slug: "",
  description: "",
  descriptionEn: "",
  basePrice: "250",
  categoryId: "",
  mainImage: "",
  sku: SKU_SUGGESTED,
  stockQuantity: 20,
  active: false,
  featured: false,
  bestSeller: false,
  sortOrder: 0,
  seoTitle: "",
  seoTitleEn: "",
  metaDescription: "",
  metaDescriptionEn: "",
  canonicalUrl: "",
  gallery: [],
  colors: [],
  sizes: [],
  addonIds: []
};

export function ProductForm({
  categories,
  colors,
  sizes,
  addons,
  initial
}: {
  categories: Option[];
  colors: Option[];
  sizes: Option[];
  addons: Option[];
  initial?: ProductInitial;
}) {
  const router = useRouter();
  const { locale, dict } = useAdminI18n();
  const formCopy = dict.products.form;

  const [step, setStep] = useState<(typeof steps)[number]["key"]>("basic");
  const [product, setProduct] = useState<ProductInitial>(initial ?? emptyProduct);
  // A non-ASCII (Arabic) or missing slug is treated as "untouched", so the
  // auto-slug keeps refreshing until the admin edits the field by hand.
  const [slugTouched, setSlugTouched] = useState<boolean>(() => {
    const slug = (initial?.slug ?? "").trim();
    return Boolean(initial?.id) && slug.length > 0 && /^[a-zA-Z0-9-]+$/.test(slug);
  });
  // New products show a live SKU preview generated from the name; the real
  // unique value is created on the server at save time. Existing products
  // keep the SKU that was already assigned to them.
  const skuPreview = product.id
    ? product.sku
    : product.name.trim() || product.nameEn.trim()
      ? suggestedProductSku(product.name, product.nameEn)
      : SKU_SUGGESTED;
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const currentIndex = steps.findIndex((item) => item.key === step);
  const selectedColorIds = useMemo(
    () => new Set(product.colors.map((item) => item.colorId)),
    [product.colors]
  );

  function update<K extends keyof ProductInitial>(key: K, value: ProductInitial[K]) {
    setProduct((current) => ({ ...current, [key]: value }));
  }

  function toggleColor(colorId: string) {
    setProduct((current) => {
      const exists = current.colors.some((item) => item.colorId === colorId);
      return {
        ...current,
        colors: exists
          ? current.colors.filter((item) => item.colorId !== colorId)
          : [
              ...current.colors,
              {
                colorId,
                additionalPrice: "0",
                imageUrl: current.mainImage,
                active: true,
                sortOrder: current.colors.length
              }
            ]
      };
    });
  }

  function updateColor(colorId: string, patch: Partial<ProductInitial["colors"][number]>) {
    setProduct((current) => ({
      ...current,
      colors: current.colors.map((item) =>
        item.colorId === colorId ? { ...item, ...patch } : item
      )
    }));
  }

  const selectedSizeIds = useMemo(
    () => new Set(product.sizes.map((item) => item.sizeId)),
    [product.sizes]
  );

  function toggleSize(sizeId: string) {
    setProduct((current) => {
      const exists = current.sizes.some((item) => item.sizeId === sizeId);
      return {
        ...current,
        sizes: exists
          ? current.sizes.filter((item) => item.sizeId !== sizeId)
          : [
              ...current.sizes,
              {
                sizeId,
                price: current.basePrice || "0",
                active: true,
                sortOrder: current.sizes.length
              }
            ]
      };
    });
  }

  function updateSize(sizeId: string, patch: Partial<ProductInitial["sizes"][number]>) {
    setProduct((current) => ({
      ...current,
      sizes: current.sizes.map((item) =>
        item.sizeId === sizeId ? { ...item, ...patch } : item
      )
    }));
  }

  function toggleAddon(addonId: string) {
    setProduct((current) => ({
      ...current,
      addonIds: current.addonIds.includes(addonId)
        ? current.addonIds.filter((item) => item !== addonId)
        : [...current.addonIds, addonId]
    }));
  }

  function save() {
    setMessage("");
    startTransition(async () => {
      // The checkbox set is the source of truth: every selected color is
      // saved/kept as active. This prevents the old "checked but hidden in
      // the storefront" state that used to cause product pages to 404.
      const payload = {
        ...product,
        colors: product.colors.map((item) => ({ ...item, active: true })),
        sizes: product.sizes.map((item) => ({ ...item, active: true }))
      };
      const response = await fetch(
        product.id ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const json = (await response.json()) as {
        ok: boolean;
        productId?: string;
        message?: string;
        detail?: string;
      };
      if (!json.ok) {
        setMessage([json.message ?? formCopy.saveError, json.detail].filter(Boolean).join(" — "));
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  const previewTitle =
    locale === "en"
      ? `${product.nameEn || product.name || formCopy.untitledProduct}${
          product.nameEn && product.name ? ` · ${product.name}` : ""
        }`
      : `${product.name || formCopy.untitledProduct}${product.nameEn ? ` · ${product.nameEn}` : ""}`;

  const readiness = useMemo(() => {
    const checks: Array<{
      key: "arName" | "enName" | "category" | "pricingStock" | "photo" | "seo" | "options";
      ok: boolean;
      step: (typeof steps)[number]["key"];
    }> = [
      { key: "arName", ok: product.name.trim().length >= 2, step: "basic" },
      { key: "enName", ok: product.nameEn.trim().length >= 2, step: "basic" },
      { key: "category", ok: Boolean(product.categoryId), step: "basic" },
      {
        key: "pricingStock",
        ok: Number(product.basePrice) > 0 && product.stockQuantity >= 0,
        step: "basic"
      },
      { key: "photo", ok: product.mainImage.trim().length > 0, step: "images" },
      {
        key: "seo",
        ok:
          product.seoTitle.trim().length > 0 && product.metaDescription.trim().length > 0,
        step: "seo"
      },
      {
        key: "options",
        ok:
          product.colors.length > 0 ||
          product.sizes.length > 0 ||
          product.addonIds.length > 0,
        step: "colors"
      }
    ];
    const done = checks.filter((item) => item.ok).length;
    const pct = Math.round((done / checks.length) * 100);

    const sizePrices = product.sizes
      .map((s) => Number(s.price))
      .filter((v) => Number.isFinite(v) && v > 0);
    const baseMin = sizePrices.length ? Math.min(...sizePrices) : Number(product.basePrice) || 0;
    const baseMax = sizePrices.length ? Math.max(...sizePrices) : Number(product.basePrice) || 0;
    const colorExtras = product.colors
      .map((c) => Number(c.additionalPrice))
      .filter((v) => Number.isFinite(v) && v >= 0);
    const maxColorExtra = colorExtras.length ? Math.max(...colorExtras) : 0;
    const addonsSum = product.addonIds.reduce((sum, id) => {
      const match = addons.find((a) => a.id === id);
      return sum + (match ? Number(match.price ?? 0) : 0);
    }, 0);

    return {
      checks,
      done,
      total: checks.length,
      pct,
      minPrice: Math.round(baseMin),
      maxPrice: Math.round(baseMax + maxColorExtra + addonsSum)
    };
  }, [product, addons]);

  const ringRadius = 20;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDash = (readiness.pct / 100) * ringCircumference;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-[#E5DDD0] bg-white p-4 sm:p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r={ringRadius} fill="none" stroke="#EDE8E0" strokeWidth="4.5" />
                <circle
                  cx="24"
                  cy="24"
                  r={ringRadius}
                  fill="none"
                  stroke="#B85A2D"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${ringDash} ${ringCircumference}`}
                />
              </svg>
              <span className="absolute font-mono text-[11px] font-bold text-[#1C1917]" dir="ltr">
                {readiness.pct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1917]">{formCopy.readiness.title}</p>
              <p className="text-xs text-[#78716C]">
                {interpolate(formCopy.readiness.completeLabel, {
                  done: readiness.done,
                  total: readiness.total
                })}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-[#EDE8E0] bg-[#FAF8F5] px-3.5 py-1.5 text-xs text-[#665E57]">
            {formCopy.readiness.priceSpread}:{" "}
            <strong className="font-mono font-bold text-[#1C1917]" dir="ltr">
              {readiness.minPrice === readiness.maxPrice
                ? `${readiness.minPrice} EGP`
                : `${readiness.minPrice}–${readiness.maxPrice} EGP`}
            </strong>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {readiness.checks.map((item) => (
            <button
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                item.ok
                  ? "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
                  : "border-[#E5DDD0] bg-[#FAF8F5] text-[#78716C] hover:border-[#B85A2D] hover:text-[#1C1917]"
              )}
              key={item.key}
              onClick={() => setStep(item.step)}
              type="button"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  item.ok ? "bg-[#2F463B]" : "bg-[#C7924D]"
                )}
              />
              {formCopy.readiness.checks[item.key]}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs sm:text-sm font-medium transition-all",
                item.key === step
                  ? "border-[#1C1917] bg-[#1C1917] text-white shadow-sm"
                  : "border-[#DED7CB] bg-white text-[#57534E] hover:border-[#B85A2D] hover:text-[#1C1917]"
              )}
              key={item.key}
              onClick={() => setStep(item.key)}
              type="button"
            >
              {index < currentIndex ? (
                <Check
                  size={15}
                  className={item.key === step ? "text-[#E5A776]" : "text-[#B85A2D]"}
                />
              ) : (
                <Icon size={15} />
              )}
              {formCopy.steps[item.key]}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
        {step === "basic" ? (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={dict.common.nameArPrimary}>
                <Input
                  dir="rtl"
                  value={product.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setProduct((current) => ({
                      ...current,
                      name,
                      slug: slugTouched
                        ? current.slug
                        : suggestProductSlug(name, "", current.nameEn)
                    }));
                  }}
                />
              </Field>
              <Field label={dict.common.nameEnSecondary}>
                <Input
                  dir="ltr"
                  value={product.nameEn}
                  onChange={(event) => {
                    const nameEn = event.target.value;
                    setProduct((current) => ({
                      ...current,
                      nameEn,
                      slug: slugTouched
                        ? current.slug
                        : suggestProductSlug(current.name, "", nameEn)
                    }));
                  }}
                />
              </Field>
              <Field hint={formCopy.slugHint} label={formCopy.slug}>
                <Input
                  dir="ltr"
                  value={product.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update("slug", event.target.value);
                  }}
                />
              </Field>
              <Field hint={formCopy.skuHint} label={formCopy.sku}>
                <Input dir="ltr" readOnly value={skuPreview} />
              </Field>
              <Field label={formCopy.category}>
                <select
                  className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                  value={product.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                >
                  <option value="">{formCopy.chooseCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {formatOptionLabel(category, locale)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={formCopy.basePrice}>
                <Input
                  dir="ltr"
                  min="1"
                  type="number"
                  value={product.basePrice}
                  onChange={(event) => update("basePrice", event.target.value)}
                />
              </Field>
              <Field label={formCopy.stockQuantity}>
                <Input
                  dir="ltr"
                  min="0"
                  type="number"
                  value={product.stockQuantity}
                  onChange={(event) => update("stockQuantity", Number(event.target.value))}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={dict.common.descriptionArPrimary}>
                <Textarea
                  dir="rtl"
                  value={product.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </Field>
              <Field label={dict.common.descriptionEnSecondary}>
                <Textarea
                  dir="ltr"
                  value={product.descriptionEn}
                  onChange={(event) => update("descriptionEn", event.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-5 pt-1">
              {(["active", "featured", "bestSeller"] as const).map((key) => (
                <label
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]"
                  key={key}
                >
                  <input
                    checked={Boolean(product[key])}
                    className="h-5 w-5 rounded accent-[#B85A2D]"
                    onChange={(event) => update(key, event.target.checked)}
                    type="checkbox"
                  />
                  <span>{formCopy.flags[key]}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === "images" ? (
          <div className="grid gap-5">
            <UploadField
              label={formCopy.mainPhoto}
              value={product.mainImage}
              onChange={(value) => update("mainImage", value)}
            />
            <p className="-mt-3 text-sm text-[#78716C] font-light">{formCopy.mainPhotoHint}</p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-xl font-bold text-[#1C1917]">
                  {formCopy.gallery}
                </h2>
                <Button
                  onClick={() =>
                    update("gallery", [
                      ...product.gallery,
                      {
                        url: product.mainImage,
                        alt: product.name,
                        altEn: product.nameEn,
                        sortOrder: product.gallery.length
                      }
                    ])
                  }
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  {formCopy.addImage}
                </Button>
              </div>
              {product.gallery.map((image, index) => (
                <div
                  className="grid gap-3 rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                  key={index}
                >
                  <UploadField
                    label={dict.common.imageUrl}
                    value={image.url}
                    onChange={(url) => {
                      const gallery = product.gallery.slice();
                      gallery[index] = { ...image, url };
                      update("gallery", gallery);
                      if (product.mainImage === image.url) update("mainImage", url);
                    }}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={formCopy.altArPrimary}>
                      <Input
                        dir="rtl"
                        value={image.alt}
                        onChange={(event) => {
                          const gallery = product.gallery.slice();
                          gallery[index] = { ...image, alt: event.target.value };
                          update("gallery", gallery);
                        }}
                      />
                    </Field>
                    <Field label={formCopy.altEnSecondary}>
                      <Input
                        dir="ltr"
                        value={image.altEn}
                        onChange={(event) => {
                          const gallery = product.gallery.slice();
                          gallery[index] = { ...image, altEn: event.target.value };
                          update("gallery", gallery);
                        }}
                      />
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      aria-pressed={product.mainImage === image.url}
                      disabled={!image.url}
                      onClick={() => update("mainImage", image.url)}
                      type="button"
                      size="sm"
                      variant={product.mainImage === image.url ? "secondary" : "ghost"}
                    >
                      {product.mainImage === image.url ? <Check size={15} /> : null}
                      {product.mainImage === image.url
                        ? formCopy.mainPhotoBadge
                        : formCopy.useAsMainPhoto}
                    </Button>
                    <Button
                      onClick={() =>
                        update(
                          "gallery",
                          product.gallery.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                      type="button"
                      size="sm"
                      variant="ghost"
                    >
                      {formCopy.remove}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === "colors" ? (
          <div className="grid gap-4">
            <p className="text-sm text-[#78716C] font-light">
              {product.colors.length === 0
                ? formCopy.noColorsSelected
                : interpolate(formCopy.colorsSelectedCount, { count: product.colors.length })}
            </p>
            {colors.map((color) => {
              const selected = product.colors.find((item) => item.colorId === color.id);
              return (
                <div
                  className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                  key={color.id}
                >
                  <label className="flex items-center gap-3 font-medium text-[#1C1917]">
                    <input
                      checked={selectedColorIds.has(color.id)}
                      className="h-5 w-5 rounded accent-[#B85A2D]"
                      onChange={() => toggleColor(color.id)}
                      type="checkbox"
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-[#DED7CB]"
                      style={{ background: color.hexCode }}
                    />
                    <span>{formatOptionLabel(color, locale)}</span>
                  </label>
                  {selected ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label={formCopy.additionalPrice}>
                        <Input
                          dir="ltr"
                          min="0"
                          type="number"
                          value={selected.additionalPrice}
                          onChange={(event) =>
                            updateColor(color.id, { additionalPrice: event.target.value })
                          }
                        />
                      </Field>
                      <div className="grid content-end gap-2">
                        <UploadField
                          label={formCopy.variantImage}
                          value={selected.imageUrl}
                          onChange={(imageUrl) => updateColor(color.id, { imageUrl })}
                        />
                        <Button
                          aria-pressed={product.mainImage === selected.imageUrl}
                          className="justify-self-start"
                          disabled={!selected.imageUrl}
                          onClick={() => update("mainImage", selected.imageUrl)}
                          type="button"
                          size="sm"
                          variant={product.mainImage === selected.imageUrl ? "secondary" : "ghost"}
                        >
                          {product.mainImage === selected.imageUrl ? <Check size={15} /> : null}
                          {product.mainImage === selected.imageUrl
                            ? formCopy.mainPhotoBadge
                            : formCopy.useAsMainPhoto}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {step === "sizes" ? (
          <div className="grid gap-4">
            <p className="text-sm text-[#78716C] font-light">
              {product.sizes.length === 0
                ? formCopy.noSizesSelected
                : interpolate(formCopy.sizesSelectedCount, { count: product.sizes.length })}
            </p>
            {sizes.length === 0 ? (
              <p className="text-sm text-[#78716C] font-light">{formCopy.noSizesExist}</p>
            ) : null}
            {sizes.map((size) => {
              const selected = product.sizes.find((item) => item.sizeId === size.id);
              return (
                <div className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4" key={size.id}>
                  <label className="flex items-center gap-3 font-medium text-[#1C1917]">
                    <input
                      checked={selectedSizeIds.has(size.id)}
                      className="h-5 w-5 rounded accent-[#B85A2D]"
                      onChange={() => toggleSize(size.id)}
                      type="checkbox"
                    />
                    <span>{formatOptionLabel(size, locale)}</span>
                  </label>
                  {selected ? (
                    <div className="mt-4 max-w-60">
                      <Field label={formCopy.fullPriceForProduct}>
                        <Input
                          dir="ltr"
                          min="1"
                          type="number"
                          value={selected.price}
                          onChange={(event) => updateSize(size.id, { price: event.target.value })}
                        />
                      </Field>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {step === "addons" ? (
          <div className="grid gap-3">
            {addons.map((addon) => (
              <label
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 transition hover:border-[#B85A2D]/50"
                key={addon.id}
              >
                <span className="font-medium text-[#1C1917]">
                  {formatOptionLabel(addon, locale)}
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="text-sm font-medium text-[#B85A2D]" dir="ltr">
                    +{addon.price} {dict.common.egp}
                  </span>
                  <input
                    checked={product.addonIds.includes(addon.id)}
                    className="h-5 w-5 rounded accent-[#B85A2D]"
                    onChange={() => toggleAddon(addon.id)}
                    type="checkbox"
                  />
                </span>
              </label>
            ))}
          </div>
        ) : null}

        {step === "seo" ? (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={formCopy.seoTitleAr}>
                <Input
                  dir="rtl"
                  value={product.seoTitle}
                  onChange={(event) => update("seoTitle", event.target.value)}
                />
              </Field>
              <Field label={formCopy.seoTitleEn}>
                <Input
                  dir="ltr"
                  value={product.seoTitleEn}
                  onChange={(event) => update("seoTitleEn", event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={formCopy.metaDescriptionAr}>
                <Textarea
                  dir="rtl"
                  value={product.metaDescription}
                  onChange={(event) => update("metaDescription", event.target.value)}
                />
              </Field>
              <Field label={formCopy.metaDescriptionEn}>
                <Textarea
                  dir="ltr"
                  value={product.metaDescriptionEn}
                  onChange={(event) => update("metaDescriptionEn", event.target.value)}
                />
              </Field>
            </div>
            <Field label={formCopy.canonicalUrl}>
              <Input
                dir="ltr"
                value={product.canonicalUrl}
                onChange={(event) => update("canonicalUrl", event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === "preview" ? (
          <div className="grid gap-4 text-sm text-[#57534E] font-light">
            <p>
              <strong className="font-semibold text-[#1C1917]">{previewTitle}</strong> —{" "}
              {interpolate(formCopy.previewSummary, {
                name: previewTitle,
                colors: product.colors.length,
                sizes: product.sizes.length,
                addons: product.addonIds.length,
                stock: product.stockQuantity,
                price: product.basePrice
              })}
            </p>
            {product.mainImage ? (
              <div className="relative h-80 overflow-hidden rounded-2xl bg-[#EDE7DD]">
                <Image alt="" className="object-cover" fill src={product.mainImage} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-sm text-red-800">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          disabled={currentIndex === 0}
          onClick={() => setStep(steps[Math.max(0, currentIndex - 1)].key)}
          type="button"
          variant="outline"
        >
          {formCopy.previous}
        </Button>
        <div className="flex gap-3">
          <Button
            disabled={currentIndex === steps.length - 1}
            onClick={() => setStep(steps[Math.min(steps.length - 1, currentIndex + 1)].key)}
            type="button"
            variant="outline"
          >
            {formCopy.next}
          </Button>
          <Button disabled={pending} onClick={save} type="button">
            {pending ? dict.common.saving : formCopy.saveProduct}
          </Button>
        </div>
      </div>
    </div>
  );
}
