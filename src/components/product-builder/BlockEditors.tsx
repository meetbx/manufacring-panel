"use client";

import React from "react";
import { DetailBlock } from "@/lib/validations/product-details";
import Uploader from "@/components/media/Uploader"; // ✅ Correct default import
interface BlockEditorProps {
  block: DetailBlock;
  onChange: (updatedBlock: DetailBlock) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ block, onChange }) => {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <div className="flex gap-4">
            <select
              value={block.level || "h2"}
              onChange={(e) => onChange({ ...block, level: e.target.value as "h1" | "h2" | "h3" })}
              className="border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="h1">H1 (Large)</option>
              <option value="h2">H2 (Medium)</option>
              <option value="h3">H3 (Small)</option>
            </select>
            <input
              type="text"
              value={block.content || ""}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="Enter heading text..."
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <textarea
            rows={4}
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Enter body text paragraph..."
            className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <Uploader
            value={block.url ? [block.url] : []}
            onChange={(urls) => onChange({ ...block, url: urls[0] || "" })}
            maxFiles={1}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={block.alt || ""}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              placeholder="Alt description (SEO)"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={block.caption || ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <Uploader
            value={block.images.map((img) => img.url)}
            onChange={(urls) =>
              onChange({
                ...block,
                images: urls.map((url) => ({ url, alt: "", caption: "" })),
              })
            }
            maxFiles={8}
          />
        </div>
      );

    case "banner":
      return (
        <div className="space-y-3">
          <Uploader
            value={block.imageUrl ? [block.imageUrl] : []}
            onChange={(urls) => onChange({ ...block, imageUrl: urls[0] || "" })}
            maxFiles={1}
          />
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Banner Header Title"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={block.subtitle || ""}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            placeholder="Banner Subtitle / Callout"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      );

    case "bullet_list":
      return (
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...block.items];
                  updated[index] = e.target.value;
                  onChange({ ...block, items: updated });
                }}
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
                className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, "New bullet point"] })}
            className="text-sm text-blue-600 hover:underline font-medium pt-1 inline-block"
          >
            + Add Item
          </button>
        </div>
      );

    case "image_text":
    case "text_image":
      return (
        <div className="space-y-3">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Layout Image Alignment:</label>
            <select
              value={block.imagePosition || (block.type === "image_text" ? "left" : "right")}
              onChange={(e) => onChange({ ...block, imagePosition: e.target.value as "left" | "right" })}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              <option value="left">Image Left / Text Right</option>
              <option value="right">Text Left / Image Right</option>
            </select>
          </div>
          <Uploader
            value={block.imageUrl ? [block.imageUrl] : []}
            onChange={(urls) => onChange({ ...block, imageUrl: urls[0] || "" })}
            maxFiles={1}
          />
          <input
            type="text"
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Section Heading"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            value={block.text || ""}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Section Body Content..."
            className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={block.videoUrl || ""}
            onChange={(e) => onChange({ ...block, videoUrl: e.target.value })}
            placeholder="Video URL (YouTube / MP4 CDN link)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={block.caption || ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Video Caption"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      );

    default:
      return null;
  }
};