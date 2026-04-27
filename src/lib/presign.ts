import { createClient } from "@/lib/supabase/client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function presignAsset(assetId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/presign", {
    method: "POST",
    headers,
    body: JSON.stringify({ asset_id: assetId }),
  });

  if (!res.ok) throw new Error("Failed to presign asset");
  return res.json();
}

export async function presignBatch(assetIds: string[]) {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/presign-batch", {
    method: "POST",
    headers,
    body: JSON.stringify({ asset_ids: assetIds }),
  });

  if (!res.ok) throw new Error("Failed to presign batch");
  return res.json();
}
