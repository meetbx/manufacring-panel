"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Uploader from "@/components/media/Uploader";
import { Loader2 } from "lucide-react";

// 1. Define your valid database Location IDs and City Names
const LOCATIONS = [
  { id: "cmuco0szw0000ts1k5ihrsgmx", city: "Ahmedabad", state: "Gujarat" },
  { id: "cmuco0tfx0001ts1k1uxqloai", city: "Pune", state: "Maharashtra" },
  { id: "cmudyn8pm0004tsi8x6l5mofe", city: "Delhi NCR", state: "Delhi" },
  { id: "cmudyn89d0002tsi8zstaj7te", city: "Bengaluru", state: "Karnataka" },
  { id: "cmvtzlyps0004tslkmvs78qs7", city: "Morbi", state: "Gujarat" },
  { id: "cmvtzlzy30005tslkicskjeor", city: "Surat", state: "Gujarat" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    gstNumber: "",
    addressLine: "",
    city: LOCATIONS[0].city, // Default to first city
    pincode: "",
    locationId: LOCATIONS[0].id, // Default to first valid location ID
    yearEstablished: 2020,
    factoryAreaSqFt: 5000,
    annualTurnover: "5Cr - 10Cr",
    logo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Handler to set both locationId and city name on change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedLoc = LOCATIONS.find((loc) => loc.id === selectedId);

    if (selectedLoc) {
      setForm((prev) => ({
        ...prev,
        locationId: selectedLoc.id,
        city: selectedLoc.city,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onboarding failed");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">
      <div className="bg-white max-w-2xl w-full p-8 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Setup Company Profile</h1>
        <p className="text-slate-500 text-sm mb-6">Complete factory information to activate your manufacturer account.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Address *</label>
              <input
                type="text"
                required
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
            <div>
              {/* 3. City Dropdown replacing plain text input */}
              <label className="block text-xs font-semibold text-slate-700 mb-1">City Hub *</label>
              <select
                value={form.locationId}
                onChange={handleLocationChange}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.city} ({loc.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Established Year</label>
              <input
                type="number"
                value={form.yearEstablished}
                onChange={(e) => setForm({ ...form, yearEstablished: parseInt(e.target.value) || 2020 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Area (SqFt)</label>
              <input
                type="number"
                value={form.factoryAreaSqFt}
                onChange={(e) => setForm({ ...form, factoryAreaSqFt: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Logo</label>
            <Uploader folder="companies" label="Upload Logo" onUploadComplete={(url) => setForm({ ...form, logo: url })} />
            {form.logo && <p className="text-xs text-emerald-600 mt-1">Logo uploaded successfully</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex justify-center items-center gap-2 mt-4 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Complete Onboarding"}
          </button>
        </form>
      </div>
    </div>
  );
}