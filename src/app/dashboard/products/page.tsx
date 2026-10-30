"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Trash2 } from "lucide-react";

export default function ProductsListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.data) setProducts(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/products/${id}/publish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Product Catalogue</h1>
        <Link
          href="/dashboard/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No products found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4">{p.category?.name || "-"}</td>
                  <td className="px-6 py-4">₹{p.minPrice} - ₹{p.maxPrice}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(p.id, p.isPublished)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
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