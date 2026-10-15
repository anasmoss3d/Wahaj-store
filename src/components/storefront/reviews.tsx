"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/actions/shop";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  labels
}: {
  productId: string;
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
    <form action={action} className="grid gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
      <h3 className="text-xl font-bold text-concrete-900">{labels.title}</h3>
      <FormMessage
        error={state.error}
        success={state.success === "REVIEW_PENDING" ? labels.pending : state.success}
      />
      <input name="productId" type="hidden" value={productId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={labels.name}>
          <Input name="name" required />
        </Field>
        <Field label={labels.rating}>
          <select className="min-h-11 rounded-md border border-concrete-200 bg-white px-3" defaultValue={5} name="rating">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)} ({value}/5)
              </option>
            ))}
          </select>
        </Field>
      </div>
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

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={value >= star ? "text-wahaj-gold" : "text-concrete-200"}
          fill="currentColor"
          key={star}
          size={16}
        />
      ))}
    </span>
  );
}
