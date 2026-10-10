import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { getStoreSettings } from "@/lib/settings";

export async function StorefrontFooter() {
  const settings = await getStoreSettings();
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`;

  return (
    <footer className="mt-20 border-t border-concrete-100 bg-concrete-900 text-concrete-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-bold">وهج | Wahaj</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-concrete-200">
            Handmade concrete and cement decor with color options, metallic leaf, stones,
            and made-to-order details.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-concrete-200">
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/orders">Order tracking</Link>
          <Link href="/admin">Admin dashboard</Link>
        </div>
        <div className="grid content-start gap-3 text-sm text-concrete-200">
          <a className="inline-flex items-center gap-2" href={whatsappUrl}>
            <MessageCircle size={18} /> WhatsApp
          </a>
          <a className="inline-flex items-center gap-2" href="#" aria-label="Instagram placeholder">
            <Instagram size={18} /> Instagram
          </a>
          <span>{settings.contactEmail}</span>
        </div>
      </div>
    </footer>
  );
}
