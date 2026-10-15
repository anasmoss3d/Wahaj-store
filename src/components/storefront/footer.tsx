import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getStoreSettings } from "@/lib/settings";
import { getDictionary } from "@/lib/i18n";

export async function StorefrontFooter() {
  const [settings, dict] = await Promise.all([getStoreSettings(), getDictionary()]);
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`;

  return (
    <footer className="mt-20 border-t border-concrete-100 bg-concrete-900 text-concrete-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-bold">{dict.storeNameFull}</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-concrete-200">{dict.footerText}</p>
        </div>
        <div className="grid content-start gap-2 text-sm text-concrete-200">
          <Link href="/products">{dict.products}</Link>
          <Link href="/cart">{dict.cart}</Link>
          <Link href="/orders">{dict.orderTracking}</Link>
        </div>
        <div className="grid content-start gap-3 text-sm text-concrete-200">
          <a className="inline-flex items-center gap-2" href={whatsappUrl}>
            <MessageCircle size={18} /> {dict.whatsapp}
          </a>
          <span dir="ltr">{settings.contactEmail}</span>
        </div>
      </div>
    </footer>
  );
}
