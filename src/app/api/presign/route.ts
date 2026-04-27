import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRESIGN_URL = process.env.NEXT_PUBLIC_PRESIGN_URL!;

export async function POST(request: NextRequest) {
  // Try cookie-based session first, then fall back to Authorization header
  const supabase = await createClient();
  let accessToken: string | null = null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    accessToken = session.access_token;
  } else {
    // Fall back to Bearer token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.slice(7);
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to presign" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
