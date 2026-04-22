import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Auto-link auth user to customer record on first login
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: customer } = await serviceClient
        .from("customers")
        .select("id, auth_user_id")
        .eq("email", user.email!)
        .single();

      if (customer && !customer.auth_user_id) {
        await serviceClient
          .from("customers")
          .update({ auth_user_id: user.id })
          .eq("id", customer.id);
      }

      return NextResponse.redirect(`${origin}/gallery`);
    }

    console.error("Auth exchange failed:", error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}