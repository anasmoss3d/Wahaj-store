"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isCustomColorName } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

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
  isCustomColor?: boolean;
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

export function ProductCustomizer({
  product,
  colors,
  sizes,
  addons,
  images,
  labels,
  action,
  locale = "en"
}: {
  product: ProductOption;
  colors: ColorOption[];
  sizes: SizeOption[];
  addons: AddonOption[];
  images: GalleryImage[];
  action?: React.ReactNode;
  locale?: Locale;
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
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

  function formatPrice(value: number) {
    return formatMoney(value.toFixed(2), "EGP", locale);
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
      <div className="grid content-start gap-3.5">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl bg-[#EDE7DD] select-none touch-pan-y shadow-sm"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
              moveGallery(diff > 0 ? 1 : -1);
            }
            setTouchStartX(null);
          }}
        >
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
                className="absolute start-3.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#E5DDD0] bg-white/90 text-[#1C1917] shadow-sm transition-all hover:bg-white hover:border-[#B85A2D]"
                onClick={() => moveGallery(-1)}
                type="button"
              >
                <ChevronLeft className="rtl:rotate-180" size={20} />
              </button>
              <button
                aria-label={labels.nextImage}
                className="absolute end-3.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#E5DDD0] bg-white/90 text-[#1C1917] shadow-sm transition-all hover:bg-white hover:border-[#B85A2D]"
                onClick={() => moveGallery(1)}
                type="button"
              >
                <ChevronRight className="rtl:rotate-180" size={20} />
              </button>
              <span
                aria-live="polite"
                className="absolute bottom-3.5 end-3.5 rounded-full border border-[#E5DDD0] bg-white/90 px-3.5 py-1 text-xs font-medium text-[#1C1917] backdrop-blur-sm"
              >
                {activeImageIndex + 1} / {galleryImages.length}
              </span>
            </>
          ) : null}
        </div>
        {galleryImages.length > 1 ? (
          <div
            aria-label={labels.productPhotos}
            className="flex gap-2.5 overflow-x-auto pb-1"
            role="group"
          >
            {galleryImages.map((image, index) => (
              <button
                aria-label={`${labels.viewImage} ${index + 1}: ${image.alt}`}
                aria-pressed={image.url === activeImage?.url}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#EDE7DD] transition-all",
                  image.url === activeImage?.url
                    ? "border-[#B85A2D] shadow-sm"
                    : "border-transparent hover:border-[#DED7CB]"
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
            <Badge variant="gold" className="text-xs font-medium px-3 py-1">
              {labels.madeToOrder}
            </Badge>
            <h1 className="mt-3 font-editorial text-3xl font-black text-[#1C1917] sm:text-4xl lg:text-5xl">{product.name}</h1>
            <p className="mt-3 font-editorial text-xl font-bold text-[#B85A2D]">
              {sizes.length > 0
                ? selectedSize
                  ? formatPrice(selectedSize.price)
                  : `${labels.startsAt} ${formatPrice(Math.min(...sizes.map((size) => size.price)))}`
                : `${labels.startsAt} ${formatPrice(product.basePrice)}`}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {colors.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{labels.chooseColor}</h2>
              {selectedColor?.additionalPrice ? (
                <span className="text-xs font-medium text-[#78716C]">
                  +{formatPrice(selectedColor.additionalPrice)}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {colors.map((color) => (
                <button
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 text-start text-sm transition-all",
                    selectedColorId === color.id
                      ? "border-[#B85A2D] bg-[#FAF8F5] shadow-sm"
                      : "border-[#DED7CB] bg-white hover:border-[#B85A2D]/50"
                  )}
                  key={color.id}
                  onClick={() => {
                    setSelectedColorId(color.id);
                    setSelectedImageUrl(color.imageUrl);
                  }}
                  type="button"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-[#DED7CB]"
                    style={{ background: color.hexCode }}
                  />
                  <span className="grid min-w-0">
                    <span className="font-semibold text-[#1C1917] truncate">{color.name}</span>
                    <span className="text-xs text-[#78716C] font-light">
                      {color.additionalPrice ? `+${formatPrice(color.additionalPrice)}` : labels.included}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {selectedColor && (selectedColor.isCustomColor || isCustomColorName(selectedColor.name)) ? (
              <p
                className="rounded-2xl border border-[#E5DDD0] bg-[#F2ECE4]/75 px-4 py-3 text-sm leading-relaxed text-[#665E57]"
                role="note"
              >
                {labels.customColorHint}
              </p>
            ) : null}
          </div>
        ) : null}

        {sizes.length > 0 ? (
          <div className="grid gap-3">
            <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{labels.chooseSize}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sizes.map((size) => (
                <button
                  className={cn(
                    "flex min-h-14 flex-col items-start justify-center rounded-2xl border px-4 text-start text-sm transition-all",
                    selectedSizeId === size.id
                      ? "border-[#B85A2D] bg-[#FAF8F5] shadow-sm"
                      : "border-[#DED7CB] bg-white hover:border-[#B85A2D]/50"
                  )}
                  key={size.id}
                  onClick={() => setSelectedSizeId(size.id)}
                  type="button"
                >
                  <span className="font-semibold text-[#1C1917]">{size.name}</span>
                  <span className="text-xs font-semibold text-[#B85A2D]">
                    {formatPrice(size.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {addons.length > 0 ? (
          <div className="grid gap-3">
            <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{labels.addExtras}</h2>
            <div className="grid gap-3">
              {addons.map((addon) => (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-all",
                    selectedAddonIds.includes(addon.id)
                      ? "border-[#B85A2D] bg-[#FAF8F5] shadow-sm"
                      : "border-[#DED7CB] bg-white hover:border-[#B85A2D]/50"
                  )}
                  key={addon.id}
                >
                  <span>
                    <span className="block font-semibold text-[#1C1917]">{addon.name}</span>
                    {addon.description ? (
                      <span className="text-sm text-[#78716C] font-light">{addon.description}</span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#B85A2D]">
                      +{formatPrice(addon.price)}
                    </span>
                    <input
                      checked={selectedAddonIds.includes(addon.id)}
                      className="h-5 w-5 rounded accent-[#B85A2D]"
                      onChange={() => toggleAddon(addon.id)}
                      type="checkbox"
                    />
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#E8E2D8] py-5">
          <div className="inline-flex h-12 items-center rounded-full border border-[#DED7CB] bg-[#FAF8F5] p-1">
            <button
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[#1C1917] transition hover:bg-[#EDE7DD]"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              <Minus size={16} />
            </button>
            <span className="w-11 text-center font-semibold text-[#1C1917]">{quantity}</span>
            <button
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[#1C1917] transition hover:bg-[#EDE7DD]"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              type="button"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="text-end">
            <span className="block text-xs text-[#78716C]">{labels.total}</span>
            <span className="font-editorial text-3xl font-black text-[#1C1917]">{formatPrice(total)}</span>
          </div>
        </div>

        {message ? (
          <p
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm",
              isSuccess
                ? "border-[#CBD5C8] bg-[#E7ECE5]/80 text-[#2F463B]"
                : "border-red-200 bg-red-50/90 text-red-800"
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8E2D8] bg-[#F7F4EE]/95 p-3 shadow-soft backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="grid min-w-0 flex-1 content-center">
              <span className="text-xs text-[#78716C]">{labels.total}</span>
              <span className="truncate font-editorial text-lg font-bold text-[#1C1917]">{formatPrice(total)}</span>
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
