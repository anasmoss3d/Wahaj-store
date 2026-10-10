"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, ImageIcon, Package, Palette, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { UploadField } from "@/components/admin/upload-field";
import { cn, slugify } from "@/lib/utils";

type Option = { id: string; name: string; hexCode?: string; price?: string };
type ProductInitial = {
  id?: string;
  name: string;
  slug: string;
  description: string;
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
  metaDescription: string;
  canonicalUrl: string;
  gallery: Array<{ url: string; alt: string; sortOrder: number }>;
  colors: Array<{
    colorId: string;
    additionalPrice: string;
    imageUrl: string;
    active: boolean;
    sortOrder: number;
  }>;
  addonIds: string[];
};

const steps = [
  { key: "basic", label: "Basic", icon: Package },
  { key: "images", label: "Images", icon: ImageIcon },
  { key: "colors", label: "Colors", icon: Palette },
  { key: "addons", label: "Add-ons", icon: Sparkles },
  { key: "seo", label: "SEO", icon: Search },
  { key: "preview", label: "Preview", icon: Eye }
] as const;

const emptyProduct: ProductInitial = {
  name: "",
  slug: "",
  description: "",
  basePrice: "250",
  categoryId: "",
  mainImage: "",
  sku: "",
  stockQuantity: 20,
  active: false,
  featured: false,
  bestSeller: false,
  sortOrder: 0,
  seoTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  gallery: [],
  colors: [],
  addonIds: []
};

export function ProductForm({
  categories,
  colors,
  addons,
  initial
}: {
  categories: Option[];
  colors: Option[];
  addons: Option[];
  initial?: ProductInitial;
}) {
  const router = useRouter();
  const [step, setStep] = useState<(typeof steps)[number]["key"]>("basic");
  const [product, setProduct] = useState<ProductInitial>(initial ?? emptyProduct);
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
      colors: current.colors.map((item) => (item.colorId === colorId ? { ...item, ...patch } : item))
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
      const response = await fetch(
        product.id ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product)
        }
      );
      const payload = (await response.json()) as { ok: boolean; productId?: string; message?: string };
      if (!payload.ok) {
        setMessage(payload.message ?? "Could not save product.");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold",
                item.key === step ? "bg-wahaj-teal text-white" : "bg-white text-concrete-700"
              )}
              key={item.key}
              onClick={() => setStep(item.key)}
              type="button"
            >
              {index < currentIndex ? <Check size={16} /> : <Icon size={16} />}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
        {step === "basic" ? (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product name">
                <Input
                  value={product.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    update("name", name);
                    if (!product.slug) update("slug", slugify(name));
                  }}
                />
              </Field>
              <Field label="Slug">
                <Input value={product.slug} onChange={(event) => update("slug", event.target.value)} />
              </Field>
              <Field label="SKU">
                <Input value={product.sku} onChange={(event) => update("sku", event.target.value)} />
              </Field>
              <Field label="Category">
                <select
                  className="min-h-11 rounded-md border border-concrete-200 px-3"
                  value={product.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Base price">
                <Input
                  min="1"
                  type="number"
                  value={product.basePrice}
                  onChange={(event) => update("basePrice", event.target.value)}
                />
              </Field>
              <Field label="Stock quantity">
                <Input
                  min="0"
                  type="number"
                  value={product.stockQuantity}
                  onChange={(event) => update("stockQuantity", Number(event.target.value))}
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={product.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-5">
              {(["active", "featured", "bestSeller"] as const).map((key) => (
                <label className="inline-flex items-center gap-2 text-sm font-semibold" key={key}>
                  <input
                    checked={Boolean(product[key])}
                    className="h-5 w-5 accent-wahaj-teal"
                    onChange={(event) => update(key, event.target.checked)}
                    type="checkbox"
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === "images" ? (
          <div className="grid gap-5">
            <UploadField
              label="Main image"
              value={product.mainImage}
              onChange={(value) => update("mainImage", value)}
            />
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Gallery</h2>
                <Button
                  onClick={() =>
                    update("gallery", [
                      ...product.gallery,
                      { url: product.mainImage, alt: product.name, sortOrder: product.gallery.length }
                    ])
                  }
                  type="button"
                  variant="ghost"
                >
                  Add image
                </Button>
              </div>
              {product.gallery.map((image, index) => (
                <div className="grid gap-3 rounded-md bg-concrete-50 p-3 md:grid-cols-[1fr_1fr_auto]" key={index}>
                  <UploadField
                    label="Image URL"
                    value={image.url}
                    onChange={(url) => {
                      const gallery = product.gallery.slice();
                      gallery[index] = { ...image, url };
                      update("gallery", gallery);
                    }}
                  />
                  <Field label="Alt text">
                    <Input
                      value={image.alt}
                      onChange={(event) => {
                        const gallery = product.gallery.slice();
                        gallery[index] = { ...image, alt: event.target.value };
                        update("gallery", gallery);
                      }}
                    />
                  </Field>
                  <Button
                    className="self-end"
                    onClick={() => update("gallery", product.gallery.filter((_, itemIndex) => itemIndex !== index))}
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === "colors" ? (
          <div className="grid gap-4">
            {colors.map((color) => {
              const selected = product.colors.find((item) => item.colorId === color.id);
              return (
                <div className="rounded-md border border-concrete-100 p-4" key={color.id}>
                  <label className="flex items-center gap-3 font-semibold">
                    <input
                      checked={selectedColorIds.has(color.id)}
                      className="h-5 w-5 accent-wahaj-teal"
                      onChange={() => toggleColor(color.id)}
                      type="checkbox"
                    />
                    <span
                      className="h-6 w-6 rounded-full border"
                      style={{ background: color.hexCode }}
                    />
                    {color.name}
                  </label>
                  {selected ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Additional price">
                        <Input
                          min="0"
                          type="number"
                          value={selected.additionalPrice}
                          onChange={(event) =>
                            updateColor(color.id, { additionalPrice: event.target.value })
                          }
                        />
                      </Field>
                      <UploadField
                        label="Variant image"
                        value={selected.imageUrl}
                        onChange={(imageUrl) => updateColor(color.id, { imageUrl })}
                      />
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
              <label className="flex items-center justify-between rounded-md border border-concrete-100 p-4" key={addon.id}>
                <span className="font-semibold">{addon.name}</span>
                <span className="inline-flex items-center gap-3">
                  <span className="text-sm text-concrete-500">+{addon.price} EGP</span>
                  <input
                    checked={product.addonIds.includes(addon.id)}
                    className="h-5 w-5 accent-wahaj-teal"
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
            <Field label="SEO title">
              <Input value={product.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} />
            </Field>
            <Field label="Meta description">
              <Textarea
                value={product.metaDescription}
                onChange={(event) => update("metaDescription", event.target.value)}
              />
            </Field>
            <Field label="Canonical URL">
              <Input
                value={product.canonicalUrl}
                onChange={(event) => update("canonicalUrl", event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === "preview" ? (
          <div className="grid gap-4 text-sm text-concrete-700">
            <p>
              <strong>{product.name || "Untitled product"}</strong> will publish with {product.colors.length} color
              option(s), {product.addonIds.length} add-on(s), stock {product.stockQuantity}, and base price{" "}
              {product.basePrice} EGP.
            </p>
            {product.mainImage ? (
              <div className="relative h-80 overflow-hidden rounded-md bg-concrete-100">
                <Image alt="" className="object-cover" fill src={product.mainImage} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          disabled={currentIndex === 0}
          onClick={() => setStep(steps[Math.max(0, currentIndex - 1)].key)}
          type="button"
          variant="ghost"
        >
          Previous
        </Button>
        <div className="flex gap-3">
          <Button
            disabled={currentIndex === steps.length - 1}
            onClick={() => setStep(steps[Math.min(steps.length - 1, currentIndex + 1)].key)}
            type="button"
            variant="ghost"
          >
            Next
          </Button>
          <Button disabled={pending} onClick={save} type="button">
            {pending ? "Saving..." : "Save product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
