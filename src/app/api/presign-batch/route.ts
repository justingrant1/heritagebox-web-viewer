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
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.slice(7);
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const assetIds: string[] = body.asset_ids ?? [];

  if (assetIds.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  // Call the single presign function for each asset in parallel (batched)
  const results = await Promise.all(
    assetIds.map(async (assetId) => {
      const res = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ asset_id: assetId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { asset_id: assetId, url: data.url };
    })
  );

  const urls = results.filter(Boolean);
  return NextResponse.json({ urls });
}
