"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Uploader from "@/components/media/Uploader";
import CategorySelector from "@/components/products/CategorySelector";
import { ProductDetailsBuilder } from "@/components/product-builder/ProductDetailsBuilder";

type Tier = { minQty: number; price: number };
type Spec = { name: string; value: string };

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          throw new Error(`Failed to load product (Status: ${res.status})`);
        }

        const data = await res.json();
        const rawProduct = data.data || data;

        // Transform specs object back into array format for UI editing if needed
        const specsArray: Spec[] = rawProduct.specifications
          ? Object.entries(rawProduct.specifications).map(([name, value]) => ({
              name,
              value: String(value),
            }))
          : [];

        // Ensure priceTiers is parsed as an array
        const tiersArray: Tier[] = Array.isArray(rawProduct.priceTiers)
          ? rawProduct.priceTiers
          : [];

        setForm({
          ...rawProduct,
          specifications: specsArray,
          priceTiers: tiersArray,
        });
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  // --- Dynamic Handlers ---
  const addTier = () => {
    if (form.priceTiers.length < 3) {
      setForm((prev: any) => ({
        ...prev,
        priceTiers: [...prev.priceTiers, { minQty: 1, price: 0 }],
      }));
    }
  };

  const updateTier = (index: number, field: keyof Tier, val: number) => {
    setForm((prev: any) => ({
      ...prev,
      priceTiers: prev.priceTiers.map((tier: Tier, i: number) =>
        i === index ? { ...tier, [field]: val } : tier
      ),
    }));
  };

  const removeTier = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      priceTiers: prev.priceTiers.filter((_: any, i: number) => i !== index),
    }));
  };

  const addSpec = () =>
    setForm((prev: any) => ({
      ...prev,
      specifications: [...prev.specifications, { name: "", value: "" }],
    }));

  const updateSpec = (index: number, field: keyof Spec, val: string) => {
    setForm((prev: any) => ({
      ...prev,
      specifications: prev.specifications.map((spec: Spec, i: number) =>
        i === index ? { ...spec, [field]: val } : spec
      ),
    }));
  };

  const removeSpec = (index: number) =>
    setForm((prev: any) => ({
      ...prev,
      specifications: prev.specifications.filter((_: any, i: number) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      alert("Please select a valid category.");
      return;
    }
    if (form.priceTiers.length === 0 || form.priceTiers.length > 3) {
      alert("Please add between 1 and 3 wholesale price tiers.");
      return;
    }

    setSaving(true);

    try {
      // Convert specifications array back into a key-value record object
      const specificationsObject = form.specifications.reduce((acc: any, spec: Spec) => {
        const key = spec.name.trim();
        const val = spec.value.trim();
        if (key && val) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const payload = {
        ...form,
        minPrice: form.minPrice,
        maxPrice: form.minPrice, // Keeps single base price synced to schema
        specifications: specificationsObject,
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update product details");
      }

      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving product:", err);
      alert(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading product details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Edit Product</h1>
        <button
          type="button"
          onClick={() => router.push("/dashboard/products")}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={form?.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={5}
              value={form?.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CategorySelector
                value={form?.categoryId || ""}
                onChange={(categoryId) => setForm({ ...form, categoryId })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">HS Code</label>
              <input
                type="text"
                value={form?.hsCode || ""}
                onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>
        </section>

        {/* Pricing & Order Details */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Pricing & Order Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base Unit Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={form?.minPrice ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm({ ...form, minPrice: val, maxPrice: val });
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit *</label>
              <select
                value={form?.unit || "Piece"}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="Piece">Piece</option>
                <option value="Kg">Kg</option>
                <option value="Ton">Ton</option>
                <option value="Litre">Litre</option>
                <option value="Meter">Meter</option>
                <option value="Set">Set</option>
                <option value="Box">Box</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MOQ *</label>
              <input
                type="number"
                min="1"
                required
                value={form?.moq ?? 1}
                onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Wholesale Tier Pricing (1 to 3 tiers) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-sm font-medium text-slate-700">Wholesale Tier Pricing</label>
                <p className="text-xs text-slate-400">Add 1 to 3 pricing tiers for volume discounts</p>
              </div>
              {form?.priceTiers?.length < 3 && (
                <button
                  type="button"
                  onClick={addTier}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Tier ({form?.priceTiers?.length || 0}/3)
                </button>
              )}
            </div>

            {form?.priceTiers?.map((tier: Tier, i: number) => (
              <div key={i} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Min Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={tier.minQty}
                    onChange={(e) => updateTier(i, "minQty", Number(e.target.value))}
                    className="w-full px-3 py-1 border rounded text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Price per unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(i, "price", Number(e.target.value))}
                    className="w-full px-3 py-1 border rounded text-sm"
                  />
                </div>
                {form.priceTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="text-red-500 hover:text-red-700 mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-900">Technical Specifications</h2>
            <button
              type="button"
              onClick={addSpec}
              className="text-xs font-semibold text-indigo-600 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Spec
            </button>
          </div>
          {form?.specifications?.map((spec: Spec, i: number) => (
            <div key={i} className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="e.g., Material"
                value={spec.name}
                onChange={(e) => updateSpec(i, "name", e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="e.g., Stainless Steel"
                value={spec.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button type="button" onClick={() => removeSpec(i)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        {/* Media Assets */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Media & Assets</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
            <Uploader
              folder="products"
              label="Upload Image"
              onUploadComplete={(url) =>
                setForm((prev: any) => ({
                  ...prev,
                  images: [...prev.images, ...(Array.isArray(url) ? url : [url])],
                }))
              }
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {form?.images?.map((img: string, i: number) => (
                <div key={i} className="relative group">
                  <img src={img} alt="Product" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        images: prev.images.filter((_: any, idx: number) => idx !== i),
                      }))
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Optional)</label>
            <input
              type="url"
              placeholder="https://youtube.com/..."
              value={form?.videoUrl || ""}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </section>

        {/* Submit Action */}
        <div className="flex justify-end gap-4 pb-12">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save All Changes
          </button>
        </div>
      </form>

      {/* Rich Product Details Builder (A+ Content) */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Rich Product Details Content (A+ Content)
        </h2>
        {productId && <ProductDetailsBuilder productId={productId} />}
      </section>
    </div>
  );
}