import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No account found</h1>
          <p className="text-stone-500">No HeritageBox account is linked to this email.</p>
        </div>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, number, status, digitization_completed_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const firstName = customer.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen">
      <nav className="border-b border-stone-200 px-4 h-14 flex items-center bg-white">
        <span className="text-xl font-bold">HeritageBox</span>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h1>
        <p className="text-stone-500 mb-8">{orders?.length || 0} orders</p>

        <div className="grid gap-4">
          {(orders || []).map((order) => {
            const isReady = ["digitization_complete", "completed", "qc", "customer_notified"].includes(order.status);

            return (
              <Link
                key={order.id}
                href={isReady ? `/gallery/${order.id}` : "#"}
                className={`block bg-white border border-stone-200 rounded-xl p-5 shadow-sm transition-all ${
                  isReady ? "hover:border-stone-400 hover:shadow-md cursor-pointer" : "opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-medium text-lg">{order.number}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isReady ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {isReady ? "Ready" : "In progress"}
                    </span>
                  </div>
                  {isReady && <span className="text-stone-400 text-sm">View →</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}