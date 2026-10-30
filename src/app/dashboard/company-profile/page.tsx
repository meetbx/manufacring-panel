"use client";

import { useEffect, useState } from "react";
import Uploader from "@/components/media/Uploader";
import { Loader2 } from "lucide-react";

export default function CompanyProfilePage() {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setForm(data.data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/company-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) setMsg("Profile updated successfully");
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading company information...</div>;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Company & Factory Profile</h1>

      {msg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{msg}</div>}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
          <input
            type="text"
            value={form?.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form?.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={form?.addressLine || ""}
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form?.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white font-medium px-5 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}