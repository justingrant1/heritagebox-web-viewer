import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import GalleryClient from "./gallery-client";

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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
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

  // Check if user signed up via magic link and has no password set
  // Users who signed in with OTP and haven't set a password have no identities with "email" provider password
  const needsPassword = user.app_metadata?.provider === "email"
    && !user.user_metadata?.has_set_password;

  return (
    <GalleryClient
      customerName={customer.name}
      orders={orders || []}
      needsPassword={needsPassword}
    />
  );
}