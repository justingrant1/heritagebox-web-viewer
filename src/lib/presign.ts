import { createClient } from "@/lib/supabase/client";

const PRESIGN_URL = process.env.NEXT_PUBLIC_PRESIGN_URL!;

export async function presignAsset(assetId: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ asset_id: assetId }),
  });

  if (!res.ok) throw new Error("Failed to presign asset");
  return res.json();
}

export async function presignBatch(assetIds: string[]) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${PRESIGN_URL}-batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ asset_ids: assetIds }),
  });

  if (!res.ok) throw new Error("Failed to presign batch");
  return res.json();
}