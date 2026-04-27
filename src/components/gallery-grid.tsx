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

const CHUNK_SIZE = 50;
const DOWNLOAD_DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GalleryGrid({ assets }: Props) {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Download progress
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

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

  async function downloadMany(targets: Asset[]) {
    if (targets.length === 0) return;
    setDownloadProgress({ current: 0, total: targets.length });

    // Collect all presigned URLs in chunks
    const allUrls: { url: string; filename: string }[] = [];
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      const chunk = targets.slice(i, i + CHUNK_SIZE);
      const ids = chunk.map((a) => a.id);
      const result = await presignBatch(ids);
      const urlMap: Record<string, string> = {};
      result.urls.forEach((u: { asset_id: string; url: string }) => { urlMap[u.asset_id] = u.url; });
      for (const asset of chunk) {
        if (urlMap[asset.id]) {
          allUrls.push({ url: urlMap[asset.id], filename: asset.original_filename });
        }
      }
    }

    // Sequentially trigger downloads
    for (let i = 0; i < allUrls.length; i++) {
      const { url, filename } = allUrls[i];
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadProgress({ current: i + 1, total: allUrls.length });
      if (i < allUrls.length - 1) await sleep(DOWNLOAD_DELAY_MS);
    }

    setDownloadProgress(null);
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)));
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  const isDownloading = downloadProgress !== null;
  const allSelected = assets.length > 0 && selectedIds.size === assets.length;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {!selectionMode ? (
          <>
            <button
              onClick={() => setSelectionMode(true)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-sm transition-colors"
            >
              Select
            </button>
            <button
              onClick={() => downloadMany(assets)}
              disabled={isDownloading || assets.length === 0}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
            >
              {isDownloading
                ? `Downloading ${downloadProgress!.current} / ${downloadProgress!.total}…`
                : `Download all (${assets.length})`}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={exitSelectionMode}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-sm transition-colors"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <button
              onClick={() => {
                const targets = assets.filter((a) => selectedIds.has(a.id));
                downloadMany(targets);
              }}
              disabled={isDownloading || selectedIds.size === 0}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
            >
              {isDownloading
                ? `Downloading ${downloadProgress!.current} / ${downloadProgress!.total}…`
                : `Download selected (${selectedIds.size})`}
            </button>
          </>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {assets.map((asset, index) => {
          const isPhoto = asset.media_type === "photo";
          const thumbUrl = urlCache[asset.id];
          const isSelected = selectedIds.has(asset.id);

          return (
            <button
              key={asset.id}
              onClick={() => {
                if (selectionMode) {
                  toggleSelection(asset.id);
                } else {
                  openViewer(index);
                }
              }}
              className={`group relative aspect-square bg-stone-900 rounded-xl overflow-hidden border transition-all ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-stone-800 hover:border-stone-600"
              }`}
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

              {/* Hover info overlay (only when not in selection mode) */}
              {!selectionMode && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                  <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{asset.original_filename}</p>
                    <p className="text-stone-400 text-[10px]">{formatBytes(asset.size_bytes)}</p>
                  </div>
                </div>
              )}

              {/* Checkbox (selection mode) */}
              {selectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "bg-black/40 border-white/60"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* Selected overlay tint */}
              {selectionMode && isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Viewer modal */}
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
