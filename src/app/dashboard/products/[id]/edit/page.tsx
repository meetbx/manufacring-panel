"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProductDetailsBuilder } from "@/components/product-builder/ProductDetailsBuilder";

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
        // Support both direct object responses and { data: ... } payloads
        setForm(data.data || data);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to update product core details");
      }

      router.push("/dashboard/products");
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
    <div className="p-8 max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>

      {/* Main Core Product Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Basic Specifications
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
          <input
            type="text"
            value={form?.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Min Price (₹)
            </label>
            <input
              type="number"
              value={form?.minPrice ?? 0}
              onChange={(e) => setForm({ ...form, minPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Price (₹)
            </label>
            <input
              type="number"
              value={form?.maxPrice ?? 0}
              onChange={(e) => setForm({ ...form, maxPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Basic Info"}
          </button>
        </div>
      </form>

      {/* Rich Product Details Builder (Separated to prevent nested form submissions) */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Rich Product Details Content (A+ Content)
        </h2>
        {productId && <ProductDetailsBuilder productId={productId} />}
      </section>
    </div>
  );
}