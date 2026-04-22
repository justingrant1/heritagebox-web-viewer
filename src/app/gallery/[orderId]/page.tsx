import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalleryGrid from "@/components/gallery-grid";
import Link from "next/link";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderGalleryPage({ params }: Props) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("id, number, customer_id")
    .eq("id", orderId)
    .eq("customer_id", customer.id)
    .single();

  if (!order) notFound();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, original_filename, media_type, size_bytes, r2_key, captured_at, created_at")
    .eq("order_id", orderId)
    .is("deleted_at", null)
    .order("original_filename", { ascending: true });

  return (
    <div className="min-h-screen">
      <nav className="border-b border-stone-800 px-4 h-14 flex items-center">
        <span className="text-xl font-bold">HeritageBox</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/gallery" className="text-stone-500 hover:text-stone-300 text-sm mb-4 block">
          ← All orders
        </Link>
        <h1 className="text-3xl font-bold mb-1">{order.number}</h1>
        <p className="text-stone-500 text-sm mb-8">{assets?.length || 0} items</p>

        <GalleryGrid assets={assets || []} />
      </main>
    </div>
  );
}