export async function presignAsset(assetId: string) {
  const res = await fetch("/api/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId }),
  });

  if (!res.ok) throw new Error("Failed to presign asset");
  return res.json();
}

export async function presignBatch(assetIds: string[]) {
  const res = await fetch("/api/presign-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_ids: assetIds }),
  });

  if (!res.ok) throw new Error("Failed to presign batch");
  return res.json();
}
