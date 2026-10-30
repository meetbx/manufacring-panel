"use client";

import Uploader from "@/components/media/Uploader";
import { Award } from "lucide-react";

export default function CertificationsPage() {
  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">ISO & Compliance Certifications</h1>
      <p className="text-slate-500 text-sm">Upload ISO, CE, or GMP certificates for buyer verification.</p>

      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Document (PDF/JPG)</label>
          <Uploader folder="certificates" label="Upload Certificate" onUploadComplete={() => alert("Uploaded successfully")} />
        </div>
      </div>
    </div>
  );
}