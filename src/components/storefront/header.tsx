import { NavbarShell } from "@/components/storefront/navbar-shell";
import { getCartView } from "@/lib/cart";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/settings";

export async function StorefrontHeader() {
  const [cart, user, admin, locale, dict, settings] = await Promise.all([
    getCartView(),
    getCurrentUser(),
    getCurrentAdmin(),
    getLocale(),
    getDictionary(),
    getStoreSettings()
  ]);

  return (
    <NavbarShell
      locale={locale}
      dict={dict}
      user={user ? { id: user.id, name: user.name, email: user.email } : null}
      isAdmin={Boolean(admin)}
      cartCount={cart.count}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
