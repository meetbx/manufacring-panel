"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Uploader from "@/components/media/Uploader";
import { Loader2, Plus, Trash2 } from "lucide-react";
import CategorySelector from "@/components/products/CategorySelector";

type Tier = { minQty: number; price: number };
type Spec = { name: string; value: string };
type Category = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();

  // State for dynamic categories & fetch status
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Comprehensive form state mapping to the Prisma schema
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    hsCode: "",
    minPrice: 0,
    maxPrice: 0,
    unit: "Piece",
    moq: 1,
    is_sample_available: false,
    sample_price: 0,
    leadTimeDays: 7,
    inStock: true,
    shippingOrigin: "",
    videoUrl: "",
    protectionEligible: true,
    priceTiers: [] as Tier[],
    specifications: [] as Spec[],
    customization_options: [] as string[],
    service_guarantees: [] as string[],
    shippingPorts: [] as string[],
    images: [] as string[],
  });

  const [loadingAction, setLoadingAction] = useState<"DRAFT" | "PUBLISH" | null>(null);
  const [error, setError] = useState("");

  // Fetch real categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => console.error("Failed to load categories"))
      .finally(() => setLoadingCategories(false));
  }, []);

  // --- Dynamic Field Handlers ---
  const addTier = () =>
    setForm((prev) => ({ ...prev, priceTiers: [...prev.priceTiers, { minQty: 1, price: 0 }] }));
  const updateTier = (index: number, field: keyof Tier, val: number) => {
    setForm((prev) => ({
      ...prev,
      priceTiers: prev.priceTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: val } : tier
      ),
    }));
  };
  const removeTier = (index: number) =>
    setForm((prev) => ({ ...prev, priceTiers: prev.priceTiers.filter((_, i) => i !== index) }));

  const addSpec = () =>
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { name: "", value: "" }] }));
  
  // Fixed immutable updateSpec handler
  const updateSpec = (index: number, field: keyof Spec, val: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: val } : spec
      ),
    }));
  };

  const removeSpec = (index: number) =>
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }));

  const addStringItem = (field: "customization_options" | "service_guarantees" | "shippingPorts") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };
  const updateStringItem = (
    field: "customization_options" | "service_guarantees" | "shippingPorts",
    index: number,
    val: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? val : item)),
    }));
  };
  const removeStringItem = (
    field: "customization_options" | "service_guarantees" | "shippingPorts",
    index: number
  ) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // --- Submit Handler ---
const handleSubmit = async (isPublished: boolean) => {
    if (form.priceTiers.length === 0 || form.priceTiers.length > 3) {
      setError("Please add between 1 and 3 wholesale price tiers.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a valid category.");
      return;
    }

    setError("");
    setLoadingAction(isPublished ? "PUBLISH" : "DRAFT");

    // Convert specifications array into an object for Prisma JSON field
    const specificationsObject = form.specifications.reduce((acc, spec) => {
      const key = spec.name.trim();
      const val = spec.value.trim();
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      ...form,
      minPrice: form.minPrice,
      maxPrice: form.minPrice, // Keeps database schema happy without showing a price range
      specifications: specificationsObject,
      isPublished,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-slate-500 mt-1 text-sm">Create a new product listing for your B2B catalog.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loadingAction !== null}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 border border-slate-300 transition-colors"
          >
            {loadingAction === "DRAFT" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loadingAction !== null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            {loadingAction === "PUBLISH" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section A: Basic Info */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Title *</label>
              <input 
                type="text" 
                required 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                placeholder="e.g., Industrial Grade Steel Bearings" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Description</label>
              <textarea 
                rows={5} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                placeholder="Detailed product overview..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
<div>
  <CategorySelector
    value={form.categoryId}
    onChange={(categoryId) => setForm({ ...form, categoryId })}
  />
</div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">HS Code</label>
                <input 
                  type="text" 
                  value={form.hsCode} 
                  onChange={(e) => setForm({ ...form, hsCode: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="Optional" 
                />
              </div>
            </div>
          </section>

{/* Section B & C: Pricing, MOQ, Tier Pricing */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Pricing & Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base Unit Price (₹) *</label>
                <input 
                  type="number" 
                  min="0" 
                  required 
                  value={form.minPrice} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setForm({ ...form, minPrice: val, maxPrice: val });
                  }} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="e.g. 30" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit *</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm">
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
                <input type="number" min="1" required value={form.moq} onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>

            {/* Wholesale Tier Pricing (Min 1, Max 3 Tiers) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Wholesale Tier Pricing</label>
                  <p className="text-xs text-slate-400">Add 1 to 3 pricing tiers for volume discounts</p>
                </div>
                {form.priceTiers.length < 3 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (form.priceTiers.length < 3) addTier();
                    }} 
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3"/> Add Tier ({form.priceTiers.length}/3)
                  </button>
                )}
              </div>

              {form.priceTiers.length === 0 && (
                <button
                  type="button"
                  onClick={addTier}
                  className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  + Add First Price Tier (Required)
                </button>
              )}

              {form.priceTiers.map((tier, i) => (
                <div key={i} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Min Quantity</label>
                    <input type="number" min="1" value={tier.minQty} onChange={(e) => updateTier(i, "minQty", Number(e.target.value))} className="w-full px-3 py-1 border rounded text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Price per unit (₹)</label>
                    <input type="number" min="0" value={tier.price} onChange={(e) => updateTier(i, "price", Number(e.target.value))} className="w-full px-3 py-1 border rounded text-sm" />
                  </div>
                  {form.priceTiers.length > 1 && (
                    <button type="button" onClick={() => removeTier(i)} className="text-red-500 hover:text-red-700 mt-5"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section D: Product Specifications */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold text-slate-900">Technical Specifications</h2>
              <button type="button" onClick={addSpec} className="text-xs font-semibold text-indigo-600 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Spec</button>
            </div>
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-4 items-center">
                <input type="text" placeholder="e.g., Material" value={spec.name} onChange={(e) => updateSpec(i, "name", e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <input type="text" placeholder="e.g., Stainless Steel 304" value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button type="button" onClick={() => removeSpec(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </section>

          {/* Section F & G: Customization & Guarantees */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Value Additions</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Customization Options</label>
                <button type="button" onClick={() => addStringItem("customization_options")} className="text-xs font-semibold text-indigo-600 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Option</button>
              </div>
              {form.customization_options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="e.g., Custom Packaging" value={opt} onChange={(e) => updateStringItem("customization_options", i, e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => removeStringItem("customization_options", i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Service Guarantees</label>
                <button type="button" onClick={() => addStringItem("service_guarantees")} className="text-xs font-semibold text-indigo-600 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Guarantee</button>
              </div>
              {form.service_guarantees.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="e.g., 1 Year Warranty" value={opt} onChange={(e) => updateStringItem("service_guarantees", i, e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => removeStringItem("service_guarantees", i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          
          {/* Section I & J: Media */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Media & Assets</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
    <Uploader
  folder="products"
  label="Upload Image"
  onUploadComplete={(url) =>
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        ...(Array.isArray(url) ? url : [url]),
      ],
    }))
  }
/>
              <div className="flex flex-wrap gap-2 mt-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="Product" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Optional)</label>
              <input type="url" placeholder="https://youtube.com/..." value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </section>

          {/* Section E & H: Logistics & Samples */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Logistics</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (Days)</label>
              <input type="number" min="0" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">In Stock</label>
              <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Offer Samples</label>
                <input type="checkbox" checked={form.is_sample_available} onChange={(e) => setForm({ ...form, is_sample_available: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              </div>
              {form.is_sample_available && (
                <input type="number" min="0" placeholder="Sample Price (₹)" value={form.sample_price} onChange={(e) => setForm({ ...form, sample_price: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              )}
            </div>
            
            <div className="pt-3 border-t space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shipping Origin</label>
                <input type="text" placeholder="e.g., Mumbai, Maharashtra" value={form.shippingOrigin} onChange={(e) => setForm({ ...form, shippingOrigin: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Shipping Ports</label>
                  <button type="button" onClick={() => addStringItem("shippingPorts")} className="text-xs font-semibold text-indigo-600">Add</button>
                </div>
                <div className="space-y-2">
                  {form.shippingPorts.map((port, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={port} onChange={(e) => updateStringItem("shippingPorts", i, e.target.value)} className="flex-1 px-3 py-1 border rounded text-sm" />
                      <button type="button" onClick={() => removeStringItem("shippingPorts", i)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}