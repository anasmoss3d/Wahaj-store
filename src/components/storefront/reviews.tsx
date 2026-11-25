"use client";

import { useActionState, useId, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/actions/shop";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<Locale, Record<number, string>> = {
  ar: {
    1: "ضعيف",
    2: "مقبول",
    3: "جيد",
    4: "جيد جداً",
    5: "ممتاز"
  },
  en: {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Excellent"
  }
};

function StarRatingInput({
  label,
  locale = "en"
}: {
  label: string;
  locale?: Locale;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const labelId = useId();
  const displayRating = hoverRating ?? rating;
  const descriptor = RATING_LABELS[locale][displayRating] ?? "";

  return (
    <div className="grid min-w-0 content-start gap-2 text-sm font-medium text-[#1C1917]">
      <span id={labelId} className="leading-snug">
        {label}
      </span>
      <input name="rating" type="hidden" value={rating} />
      <div
        aria-labelledby={labelId}
        className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DED7CB] bg-[#FAF8F5]/75 px-3.5 py-2"
        onMouseLeave={() => setHoverRating(null)}
        role="radiogroup"
      >
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = displayRating >= star;
            const isSelected = rating === star;
            return (
              <button
                aria-checked={isSelected}
                aria-label={`${star} / 5 ${RATING_LABELS[locale][star] ?? ""}`}
                className="grid h-8 w-8 place-items-center rounded-lg transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/35 active:scale-95"
                key={star}
                onClick={() => setRating(star)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setRating((curr) =>
                      locale === "ar" ? Math.max(1, curr - 1) : Math.min(5, curr + 1)
                    );
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setRating((curr) =>
                      locale === "ar" ? Math.min(5, curr + 1) : Math.max(1, curr - 1)
                    );
                  }
                }}
                onMouseEnter={() => setHoverRating(star)}
                role="radio"
                type="button"
              >
                <Star
                  className={cn(
                    "transition-colors duration-150",
                    isFilled ? "text-[#C7924D]" : "text-[#D8CFC2]"
                  )}
                  fill="currentColor"
                  size={20}
                />
              </button>
            );
          })}
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#57534E] border border-[#E8E2D8]">
          {displayRating}/5 · {descriptor}
        </span>
      </div>
    </div>
  );
}

export function ReviewForm({
  productId,
  labels,
  locale = "en"
}: {
  productId: string;
  locale?: Locale;
  labels: {
    title: string;
    name: string;
    rating: string;
    reviewTitle: string;
    body: string;
    submit: string;
    saving: string;
    pending: string;
  };
}) {
  const [state, action] = useActionState(submitReviewAction, {});

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] h-fit">
      <h3 className="font-editorial text-xl font-bold text-[#1C1917]">{labels.title}</h3>
      <FormMessage
        error={state.error}
        success={state.success === "REVIEW_PENDING" ? labels.pending : state.success}
      />
      <input name="productId" type="hidden" value={productId} />
      <Field label={labels.name}>
        <Input name="name" required />
      </Field>
      <StarRatingInput label={labels.rating} locale={locale} />
      <Field label={labels.reviewTitle}>
        <Input name="title" />
      </Field>
      <Field label={labels.body}>
        <Textarea name="body" required />
      </Field>
      <SubmitButton pendingLabel={labels.saving}>{labels.submit}</SubmitButton>
    </form>
  );
}

export function Stars({
  value,
  size = 16,
  className
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercent = Math.max(0, Math.min(100, (value - (star - 1)) * 100));
        return (
          <span
            className="relative inline-block shrink-0"
            key={star}
            style={{ width: size, height: size }}
          >
            <Star className="block text-[#E5DDD0]" fill="currentColor" size={size} />
            {fillPercent > 0 ? (
              <span
                className="absolute inset-y-0 start-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="block max-w-none text-[#C7924D]" fill="currentColor" size={size} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
