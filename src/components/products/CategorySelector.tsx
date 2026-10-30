// src/components/products/CategorySelector.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { children: number };
}

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
}

export default function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
  const [levels, setLevels] = useState<Category[][]>([[]]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      setLoadingLevel(0);
      try {
        const res = await fetch("/api/categories?parentId=null");
        const data = await res.json();
        const roots = data.categories || [];

        if (value) {
          const pathRes = await fetch(`/api/categories?includeAncestors=true&categoryId=${value}`);
          const pathData = await pathRes.json();
          const path: Category[] = pathData.path || [];

          if (path.length > 0) {
            const newSelectedIds = path.map((c) => c.id);
            setSelectedIds(newSelectedIds);
            onChange(value);

            const newLevels: Category[][] = [roots];
            for (let i = 0; i < path.length; i++) {
              const parentId = path[i].id;
              const childRes = await fetch(`/api/categories?parentId=${parentId}`);
              const childData = await childRes.json();
              if (childData.categories && childData.categories.length > 0) {
                newLevels.push(childData.categories);
              }
            }
            setLevels(newLevels);
          } else {
            setLevels([roots]);
          }
        } else {
          setLevels([roots]);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingLevel(null);
        setInitialized(true);
      }
    }

    if (!initialized) {
      init();
    }
  }, [value, initialized, onChange]);

  const handleSelectChange = async (levelIndex: number, categoryId: string) => {
    const newSelectedIds = [...selectedIds.slice(0, levelIndex), categoryId].filter(Boolean);
    setSelectedIds(newSelectedIds);

    const finalId = newSelectedIds[newSelectedIds.length - 1] || "";
    onChange(finalId);

    const newLevels = levels.slice(0, levelIndex + 1);

    if (!categoryId) {
      setLevels(newLevels);
      return;
    }

    setLoadingLevel(levelIndex + 1);
    try {
      const res = await fetch(`/api/categories?parentId=${categoryId}`);
      const data = await res.json();
      const children = data.categories || [];

      if (children.length > 0) {
        newLevels.push(children);
      }
      setLevels(newLevels);
    } catch (err) {
      console.error("Failed to load subcategories:", err);
    } finally {
      setLoadingLevel(null);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-700">Product Category Hierarchy *</label>
      
      {levels.map((levelCategories, levelIndex) => (
        <div key={levelIndex} className="relative flex items-center gap-2">
          <select
            value={selectedIds[levelIndex] || ""}
            onChange={(e) => handleSelectChange(levelIndex, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">
              {levelIndex === 0 ? "-- Select Main Category --" : `-- Select Subcategory (Level ${levelIndex + 1}) --`}
            </option>
            {levelCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {loadingLevel === levelIndex + 1 && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 absolute right-3" />
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}