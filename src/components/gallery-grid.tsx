"use client";

import { useState, useEffect } from "react";
import { presignBatch, presignAsset } from "@/lib/presign";

interface Asset {
  id: string;
  original_filename: string;
  media_type: string;
  size_bytes: number;
  r2_key: string;
  captured_at: string | null;
  created_at: string;
}

interface Props {
  assets: Asset[];
}

export default function GalleryGrid({ assets }: Props) {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Load first batch of thumbnails
  useEffect(() => {
    const photoIds = assets
      .filter((a) => a.media_type === "photo")
      .slice(0, 30)
      .map((a) => a.id);
    if (photoIds.length > 0) {
      presignBatch(photoIds).then((result) => {
        const urls: Record<string, string> = {};
        result.urls.forEach((u: { asset_id: string; url: string }) => { urls[u.asset_id] = u.url; });
        setUrlCache(urls);
      });
    }
  }, [assets]);

  async function openViewer(index: number) {
    const asset = assets[index];
    setViewerIndex(index);
    if (urlCache[asset.id]) {
      setViewerUrl(urlCache[asset.id]);
    } else {
      const result = await presignAsset(asset.id);
      setViewerUrl(result.url);
      setUrlCache((prev) => ({ ...prev, [asset.id]: result.url }));
    }
  }

  async function downloadFile(asset: Asset) {
    const result = await presignAsset(asset.id);
    const link = document.createElement("a");
    link.href = result.url;
    link.download = asset.original_filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {assets.map((asset, index) => {
          const isPhoto = asset.media_type === "photo";
          const thumbUrl = urlCache[asset.id];

          return (
            <button
              key={asset.id}
              onClick={() => openViewer(index)}
              className="group relative aspect-square bg-stone-900 rounded-xl overflow-hidden border border-stone-800 hover:border-stone-600 transition-all"
            >
              {isPhoto && thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={asset.original_filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-600">
                  <span className="text-2xl">{asset.media_type === "video" ? "🎬" : asset.media_type === "audio" ? "🎵" : "📄"}</span>
                  <span className="text-xs text-stone-500 px-2 text-center truncate max-w-full">
                    {asset.original_filename}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{asset.original_filename}</p>
                  <p className="text-stone-400 text-[10px]">{formatBytes(asset.size_bytes)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {viewerIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => { setViewerIndex(null); setViewerUrl(null); }}
        >
          <button
            onClick={() => { setViewerIndex(null); setViewerUrl(null); }}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl z-10"
          >
            ✕
          </button>

          {viewerIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); openViewer(viewerIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-3xl z-10"
            >
              ‹
            </button>
          )}

          {viewerIndex < assets.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); openViewer(viewerIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-3xl z-10"
            >
              ›
            </button>
          )}

          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {!viewerUrl ? (
              <div className="text-stone-500">Loading...</div>
            ) : assets[viewerIndex].media_type === "photo" ? (
              <img src={viewerUrl} alt={assets[viewerIndex].original_filename} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
            ) : assets[viewerIndex].media_type === "video" ? (
              <video src={viewerUrl} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-lg" />
            ) : assets[viewerIndex].media_type === "audio" ? (
              <div className="bg-stone-900 rounded-xl p-8">
                <p className="text-stone-300 mb-4">{assets[viewerIndex].original_filename}</p>
                <audio src={viewerUrl} controls autoPlay className="w-full" />
              </div>
            ) : null}

            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-white text-sm">{assets[viewerIndex].original_filename}</p>
                <p className="text-stone-500 text-xs">{formatBytes(assets[viewerIndex].size_bytes)}</p>
              </div>
              <button
                onClick={() => downloadFile(assets[viewerIndex])}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
              >
                Download
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-stone-500 text-sm">
            {viewerIndex + 1} / {assets.length}
          </div>
        </div>
      )}
    </>
  );
}