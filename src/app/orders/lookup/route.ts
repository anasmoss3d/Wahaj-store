import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  if (!orderNumber) redirect("/orders");
  redirect(`/orders/${encodeURIComponent(orderNumber)}`);
}
