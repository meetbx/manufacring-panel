"use client";

import { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";

interface UploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  onUploadComplete?: (url: string | string[]) => void;
  folder?: "products" | "companies" | "certificates";
  accept?: string;
  label?: string;
  maxFiles?: number;
}

export default function Uploader({
  value = [],
  onChange,
  onUploadComplete,
  folder = "products",
  accept = "image/*",
  label = "Upload File",
  maxFiles = 1,
}: UploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check maximum files limit
    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    setLoading(true);
    setError(null);

    const newlyUploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload/presign", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.details || data.error || "Upload failed");
        }

        if (data.url) {
          newlyUploadedUrls.push(data.url);
        }
      }

      // Merge newly uploaded URLs with existing ones
      const updatedUrls = maxFiles === 1 ? newlyUploadedUrls : [...value, ...newlyUploadedUrls];

      // Safely invoke either/both callbacks if defined
      if (typeof onChange === "function") {
        onChange(updatedUrls);
      }
      if (typeof onUploadComplete === "function") {
        onUploadComplete(maxFiles === 1 ? updatedUrls[0] || "" : updatedUrls);
      }
    } catch (err: any) {
      console.error("[UPLOADER_ERROR]", err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
      e.target.value = ""; // Reset input so re-selecting the same file works
    }
  };

  const handleRemove = (urlToRemove: string) => {
    const updatedUrls = value.filter((url) => url !== urlToRemove);
    if (typeof onChange === "function") {
      onChange(updatedUrls);
    }
    if (typeof onUploadComplete === "function") {
      onUploadComplete(maxFiles === 1 ? "" : updatedUrls);
    }
  };

  return (
    <div className="space-y-3">
      {/* Uploaded Image Previews */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
            >
              <Image
                src={url}
                alt="Uploaded file"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 transition shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button Dropzone */}
      {value.length < maxFiles && (
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition">
          {loading ? (
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-slate-500" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {loading ? "Uploading to Cloudinary..." : label}
          </span>
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}