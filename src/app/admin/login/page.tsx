import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** @deprecated Replaced by unified authentication at /auth/login. */
export default async function DeprecatedAdminLoginPage() {
  const admin = await getCurrentAdmin();
  redirect(admin ? "/admin" : "/auth/login?next=/admin");
}
