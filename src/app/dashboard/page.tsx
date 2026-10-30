// manufacturer-panel/src/app/dashboard/page.tsx
import { getAuthenticatedManufacturer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, CheckCircle, Clock, AlertCircle, Plus, Building2 } from "lucide-react";

export default async function DashboardPage() {
  const auth = await getAuthenticatedManufacturer();

  if (auth.error) {
    redirect("/login");
  }

  if (!auth.manufacturerId) {
    redirect("/onboarding");
  }

  const [company, totalProducts, publishedProducts, draftProducts, recentProducts] = await Promise.all([
    prisma.manufacturer.findUnique({
      where: { id: auth.manufacturerId },
      include: { location: true },
    }),
    prisma.product.count({ where: { manufacturerId: auth.manufacturerId } }),
    prisma.product.count({ where: { manufacturerId: auth.manufacturerId, isPublished: true } }),
    prisma.product.count({ where: { manufacturerId: auth.manufacturerId, isPublished: false } }),
    prisma.product.findMany({
      where: { manufacturerId: auth.manufacturerId },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { category: true },
    }),
  ]);

  // Profile completion score
  const fields = [
    company?.name,
    company?.description,
    company?.gstNumber,
    company?.logo,
    company?.addressLine,
    company?.city,
    company?.yearEstablished,
    company?.factoryAreaSqFt,
  ];
  const completedFields = fields.filter(Boolean).length;
  const profileCompletionPct = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company?.name} Management Console</h1>
          <p className="text-slate-500 text-sm">Overview of catalog listings, publication states, and company health.</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalProducts}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Package className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live / Published</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{publishedProducts}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drafts</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{draftProducts}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Score</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{profileCompletionPct}%</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Recent Catalog Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent Products</h2>
          <Link href="/dashboard/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View All Products &rarr;
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No products created yet</p>
            <p className="text-slate-400 text-sm mt-1">Start populating your catalog to connect with bulk buyers.</p>
            <Link
              href="/dashboard/products/new"
              className="inline-block mt-4 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Add First Product
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price Range</th>
                <th className="px-6 py-3">MOQ</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4">{p.category?.name || "Uncategorized"}</td>
                  <td className="px-6 py-4">₹{p.minPrice} - ₹{p.maxPrice}</td>
                  <td className="px-6 py-4">{p.moq} {p.unit}s</td>
                  <td className="px-6 py-4">
                    {p.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}