"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  basePrice: number;
};

type ColorOption = {
  id: string;
  name: string;
  hexCode: string;
  additionalPrice: number;
  imageUrl: string;
};

type AddonOption = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
};

type SizeOption = {
  id: string;
  name: string;
  price: number;
};

type GalleryImage = {
  url: string;
  alt: string;
};

const formatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0
});

export function ProductCustomizer({
  product,
  colors,
  sizes,
  addons,
  images,
  labels,
  action
}: {
  product: ProductOption;
  colors: ColorOption[];
  sizes: SizeOption[];
  addons: AddonOption[];
  images: GalleryImage[];
  action?: React.ReactNode;
  labels: {
    madeToOrder: string;
    startsAt: string;
    chooseColor: string;
    chooseSize: string;
    customColorHint: string;
    addExtras: string;
    included: string;
    quantity: string;
    total: string;
    addToCart: string;
    buyNow: string;
    added: string;
    previousImage: string;
    nextImage: string;
    viewImage: string;
    productPhotos: string;
  };
}) {
  const router = useRouter();
  const [selectedColorId, setSelectedColorId] = useState(colors[0]?.id ?? "");
  // Sizes are a required choice (when the product offers any), so start with
  // nothing selected and keep the add-to-cart buttons disabled until picked.
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedColor = colors.find((color) => color.id === selectedColorId) ?? colors[0];
  const selectedSize = sizes.find((size) => size.id === selectedSizeId) ?? null;
  const sizeRequired = sizes.length > 0 && !selectedSize;
  const galleryImages = useMemo(() => {
    const candidates = [
      ...(selectedColor
        ? [{ url: selectedColor.imageUrl, alt: `${product.name} in ${selectedColor.name}` }]
        : []),
      ...images
    ];
    return Array.from(new Map(candidates.map((image) => [image.url, image])).values());
  }, [images, product.name, selectedColor]);
  const activeImage = galleryImages.find((image) => image.url === selectedImageUrl) ?? galleryImages[0];
  const activeImageIndex = galleryImages.findIndex((image) => image.url === activeImage?.url);
  const selectedAddons = addons.filter((addon) => selectedAddonIds.includes(addon.id));
  // A selected size carries the FULL price for the product (the base price
  // only shows as "starts at" when the customer has not picked a size yet).
  const unitPrice = useMemo(
    () =>
      (selectedSize ? selectedSize.price : product.basePrice) +
      (selectedColor?.additionalPrice ?? 0) +
      selectedAddons.reduce((sum, addon) => sum + addon.price, 0),
    [product.basePrice, selectedAddons, selectedColor, selectedSize]
  );
  const total = unitPrice * quantity;

  function toggleAddon(id: string) {
    setSelectedAddonIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function moveGallery(step: number) {
    if (galleryImages.length < 2) return;
    const nextIndex = (activeImageIndex + step + galleryImages.length) % galleryImages.length;
    setSelectedImageUrl(galleryImages[nextIndex].url);
  }

  function addToCart(goToCheckout = false) {
    setMessage("");
    setIsSuccess(false);
    startTransition(async () => {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productColorId: selectedColorId || null,
          productSizeId: selectedSizeId || null,
          productAddonIds: selectedAddonIds,
          quantity
        })
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!payload.ok) {
        setMessage(payload.message ?? "Could not add item.");
        return;
      }
      router.refresh();
      if (goToCheckout) {
        router.push("/checkout");
      } else {
        setIsSuccess(true);
        setMessage(labels.added);
      }
    });
  }

  return (
    <>
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid content-start gap-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-concrete-100">
          {activeImage ? (
            <Image
              alt={activeImage.alt}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              src={activeImage.url}
            />
          ) : null}
          {galleryImages.length > 1 ? (
            <>
              <button
                aria-label={labels.previousImage}
                className="absolute start-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-concrete-900 shadow-soft transition hover:bg-white"
                onClick={() => moveGallery(-1)}
                type="button"
              >
                <ChevronLeft className="rtl:rotate-180" size={22} />
              </button>
              <button
                aria-label={labels.nextImage}
                className="absolute end-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-concrete-900 shadow-soft transition hover:bg-white"
                onClick={() => moveGallery(1)}
                type="button"
              >
                <ChevronRight className="rtl:rotate-180" size={22} />
              </button>
              <span
                aria-live="polite"
                className="absolute bottom-3 end-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-concrete-800"
              >
                {activeImageIndex + 1} / {galleryImages.length}
              </span>
            </>
          ) : null}
        </div>
        {galleryImages.length > 1 ? (
          <div
            aria-label={labels.productPhotos}
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
          >
            {galleryImages.map((image, index) => (
              <button
                aria-label={`${labels.viewImage} ${index + 1}: ${image.alt}`}
                aria-pressed={image.url === activeImage?.url}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded border-2 transition",
                  image.url === activeImage?.url
                    ? "border-wahaj-teal"
                    : "border-transparent hover:border-concrete-300"
                )}
                key={image.url}
                onClick={() => setSelectedImageUrl(image.url)}
                type="button"
              >
                <Image alt="" className="object-cover" fill sizes="64px" src={image.url} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid content-start gap-7 pb-28 lg:pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-wahaj-gold">
              {labels.madeToOrder}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-concrete-900 sm:text-3xl md:text-4xl">{product.name}</h1>
            <p className="mt-3 text-lg font-semibold text-wahaj-teal">
              {sizes.length > 0
                ? selectedSize
                  ? formatter.format(selectedSize.price)
                  : `${labels.startsAt} ${formatter.format(Math.min(...sizes.map((size) => size.price)))}`
                : `${labels.startsAt} ${formatter.format(product.basePrice)}`}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {colors.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-concrete-900">{labels.chooseColor}</h2>
              {selectedColor?.additionalPrice ? (
                <span className="text-sm text-concrete-500">
                  +{formatter.format(selectedColor.additionalPrice)}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {colors.map((color) => (
                <button
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-md border px-3 text-start text-sm transition",
                    selectedColorId === color.id
                      ? "border-wahaj-teal bg-wahaj-teal/5"
                      : "border-concrete-200 bg-white"
                  )}
                  key={color.id}
                  onClick={() => {
                    setSelectedColorId(color.id);
                    setSelectedImageUrl(color.imageUrl);
                  }}
                  type="button"
                >
                  <span
                    className="h-6 w-6 rounded-full border border-concrete-200"
                    style={{ background: color.hexCode }}
                  />
                  <span className="grid">
                    <span className="font-semibold">{color.name}</span>
                    <span className="text-xs text-concrete-500">
                      {color.additionalPrice ? `+${formatter.format(color.additionalPrice)}` : labels.included}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {selectedColor?.name.trim().toLowerCase() === "custom color" ? (
              <p
                className="rounded-md border border-wahaj-gold/30 bg-wahaj-gold/10 px-4 py-3 text-sm leading-7 text-concrete-700"
                role="note"
              >
                {labels.customColorHint}
              </p>
            ) : null}
          </div>
        ) : null}

        {sizes.length > 0 ? (
          <div className="grid gap-3">
            <h2 className="font-semibold text-concrete-900">{labels.chooseSize}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sizes.map((size) => (
                <button
                  className={cn(
                    "flex min-h-14 flex-col items-start justify-center rounded-md border px-3 text-start text-sm transition",
                    selectedSizeId === size.id
                      ? "border-wahaj-teal bg-wahaj-teal/5"
                      : "border-concrete-200 bg-white"
                  )}
                  key={size.id}
                  onClick={() => setSelectedSizeId(size.id)}
                  type="button"
                >
                  <span className="font-semibold text-concrete-900">{size.name}</span>
                  <span className="text-xs font-semibold text-wahaj-teal">
                    {formatter.format(size.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {addons.length > 0 ? (
          <div className="grid gap-3">
          <h2 className="font-semibold text-concrete-900">{labels.addExtras}</h2>
          <div className="grid gap-3">
            {addons.map((addon) => (
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3",
                  selectedAddonIds.includes(addon.id)
                    ? "border-wahaj-gold bg-wahaj-gold/10"
                    : "border-concrete-200 bg-white"
                )}
                key={addon.id}
              >
                <span>
                  <span className="block font-semibold text-concrete-900">{addon.name}</span>
                  {addon.description ? (
                    <span className="text-sm text-concrete-500">{addon.description}</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-wahaj-teal">
                    +{formatter.format(addon.price)}
                  </span>
                  <input
                    checked={selectedAddonIds.includes(addon.id)}
                    className="h-5 w-5 accent-wahaj-teal"
                    onChange={() => toggleAddon(addon.id)}
                    type="checkbox"
                  />
                </span>
              </label>
            ))}
          </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-concrete-100 py-5">
          <div className="inline-flex h-12 items-center rounded-md border border-concrete-200 bg-white">
            <button
              aria-label="Decrease quantity"
              className="grid h-12 w-12 place-items-center"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              <Minus size={18} />
            </button>
            <span className="w-12 text-center font-semibold">{quantity}</span>
            <button
              aria-label="Increase quantity"
              className="grid h-12 w-12 place-items-center"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="text-end">
            <span className="block text-sm text-concrete-500">{labels.total}</span>
            <span className="text-3xl font-bold text-concrete-900">{formatter.format(total)}</span>
          </div>
        </div>

        {message ? (
          <p
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}
          >
            {message}
          </p>
        ) : null}

        <div className="hidden gap-3 sm:grid-cols-2 lg:grid">
          <Button disabled={isPending || sizeRequired || (colors.length > 0 && !selectedColorId)} onClick={() => addToCart(false)}>
            <ShoppingBag size={18} /> {labels.addToCart}
          </Button>
          <Button
            disabled={isPending || sizeRequired || (colors.length > 0 && !selectedColorId)}
            onClick={() => addToCart(true)}
            variant="secondary"
          >
            <Zap size={18} /> {labels.buyNow}
          </Button>
        </div>
      </div>
        {/* Mobile: fixed buy bar so total + actions stay reachable. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-concrete-100 bg-white/95 p-3 shadow-soft backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="grid min-w-0 flex-1 content-center">
              <span className="text-xs text-concrete-500">{labels.total}</span>
              <span className="truncate text-lg font-bold text-concrete-900">{formatter.format(total)}</span>
            </div>
            <Button className="flex-1" disabled={isPending || sizeRequired || (colors.length > 0 && !selectedColorId)} onClick={() => addToCart(false)}>
              <ShoppingBag size={18} /> {labels.addToCart}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
