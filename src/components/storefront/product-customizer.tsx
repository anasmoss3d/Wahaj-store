"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
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

const formatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0
});

export function ProductCustomizer({
  product,
  colors,
  addons,
  labels
}: {
  product: ProductOption;
  colors: ColorOption[];
  addons: AddonOption[];
  labels: {
    madeToOrder: string;
    startsAt: string;
    chooseColor: string;
    addExtras: string;
    included: string;
    quantity: string;
    total: string;
    addToCart: string;
    buyNow: string;
    added: string;
  };
}) {
  const router = useRouter();
  const [selectedColorId, setSelectedColorId] = useState(colors[0]?.id ?? "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedColor = colors.find((color) => color.id === selectedColorId) ?? colors[0];
  const selectedAddons = addons.filter((addon) => selectedAddonIds.includes(addon.id));
  const unitPrice = useMemo(
    () =>
      product.basePrice +
      (selectedColor?.additionalPrice ?? 0) +
      selectedAddons.reduce((sum, addon) => sum + addon.price, 0),
    [product.basePrice, selectedAddons, selectedColor]
  );
  const total = unitPrice * quantity;

  function toggleAddon(id: string) {
    setSelectedAddonIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
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
          productColorId: selectedColorId,
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
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-concrete-100">
        {selectedColor ? (
          <Image
            alt={`${product.name} in ${selectedColor.name}`}
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            src={selectedColor.imageUrl}
          />
        ) : null}
      </div>
      <div className="grid content-start gap-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-wahaj-gold">
            {labels.madeToOrder}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-concrete-900 md:text-5xl">{product.name}</h1>
          <p className="mt-3 text-lg font-semibold text-wahaj-teal">
            {labels.startsAt} {formatter.format(product.basePrice)}
          </p>
        </div>

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
                onClick={() => setSelectedColorId(color.id)}
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
        </div>

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

        <div className="grid gap-3 sm:grid-cols-2">
          <Button disabled={isPending || !selectedColorId} onClick={() => addToCart(false)}>
            <ShoppingBag size={18} /> {labels.addToCart}
          </Button>
          <Button
            disabled={isPending || !selectedColorId}
            onClick={() => addToCart(true)}
            variant="secondary"
          >
            <Zap size={18} /> {labels.buyNow}
          </Button>
        </div>
      </div>
    </section>
  );
}
