"use client";

import React, { useState, useEffect } from "react";
import { DetailBlock, BlockType } from "@/lib/validations/product-details";
import { BlockEditor } from "./BlockEditors";

interface ProductDetailsBuilderProps {
  productId: string;
  initialBlocks?: any[];
  onChange: (blocks: any[]) => void;

}

export const ProductDetailsBuilder: React.FC<ProductDetailsBuilderProps> = ({ productId }) => {
  const [blocks, setBlocks] = useState<DetailBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadBlocks() {
      try {
        const res = await fetch(`/api/products/${productId}/details`);
        if (res.ok) {
          const data = await res.json();
          setBlocks(data.blocks || []);
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlocks();
  }, [productId]);

  const addBlock = (type: BlockType) => {
    const newId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    let newBlock: DetailBlock;

    switch (type) {
      case "heading":
        newBlock = { id: newId, type: "heading", content: "New Heading", level: "h2" };
        break;
      case "text":
        newBlock = { id: newId, type: "text", content: "Enter text content here..." };
        break;
      case "image":
        newBlock = { id: newId, type: "image", url: "", alt: "", caption: "" };
        break;
      case "gallery":
        newBlock = { id: newId, type: "gallery", images: [] };
        break;
case "banner":
  newBlock = {
    id: newId,
    type: "banner",
    imageUrl: "",
    title: "",
    subtitle: "",
    link: "",
  };
  break;
      case "bullet_list":
        newBlock = { id: newId, type: "bullet_list", items: ["First bullet point"] };
        break;
case "image_text":
  newBlock = {
    id: newId,
    type: "image_text",
    imageUrl: "",
    heading: "",
    text: "",
    alt: "",
    imagePosition: "left",
  };
  break;
case "text_image":
  newBlock = {
    id: newId,
    type: "text_image",
    imageUrl: "",
    heading: "",
    text: "",
    alt: "",
    imagePosition: "right",
  };
  break;
      case "video":
        newBlock = { id: newId, type: "video", videoUrl: "", caption: "" };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  const updateBlock = (index: number, updated: DetailBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateBlock = (index: number) => {
    const target = blocks[index];
    const copy = {
      ...target,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, copy);
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/products/${productId}/details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });

      if (!res.ok) {
        throw new Error("Failed to save product details");
      }

      setMessage({ type: "success", text: "Rich product details saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred during save" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading product builder...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Rich Product Details Builder</h2>
          <p className="text-sm text-gray-500">Add dynamic rich content blocks to your product showcase</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium text-sm transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Product Details"}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Block List */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-400">
            No content blocks added yet. Choose a block type below to start building.
          </div>
        ) : (
          blocks.map((block, index) => (
            <div key={block.id} className="border rounded-lg p-4 bg-gray-50 relative space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  #{index + 1} - {block.type.replace("_", " ")}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                    className="text-xs border bg-white px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, "down")}
                    disabled={index === blocks.length - 1}
                    className="text-xs border bg-white px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateBlock(index)}
                    className="text-xs border bg-white px-2 py-1 rounded hover:bg-gray-100 text-blue-600"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    className="text-xs border bg-white px-2 py-1 rounded hover:bg-red-50 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <BlockEditor block={block} onChange={(updated) => updateBlock(index, updated)} />
            </div>
          ))
        )}
      </div>

      {/* Add Block Toolbar */}
      <div className="border-t pt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Add New Block:</label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "heading",
              "text",
              "image",
              "gallery",
              "banner",
              "bullet_list",
              "image_text",
              "text_image",
              "video",
            ] as BlockType[]
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border px-3 py-1.5 rounded font-medium capitalize transition"
            >
              + {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};