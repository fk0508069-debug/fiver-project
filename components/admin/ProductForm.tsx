"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { CATEGORY_NAMES, getSubcategories } from "@/lib/categories";

type Initial = {
  _id?: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  discount: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  sku: string;
  specifications: Record<string, string>;
  keywords: string[];
  featured: boolean;
  active: boolean;
};

const EMPTY: Initial = {
  name: "",
  description: "",
  shortDescription: "",
  price: 0,
  discount: 0,
  category: CATEGORY_NAMES[0],
  subcategory: "",
  images: [],
  stock: 0,
  sku: "",
  specifications: {},
  keywords: [],
  featured: false,
  active: true,
};

const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ProductForm({ initial }: { initial?: Initial }) {
  const [form, setForm] = useState<Initial>(initial ?? EMPTY);
  const [keywordsText, setKeywordsText] = useState((initial?.keywords ?? []).join(", "));
  const [specsText, setSpecsText] = useState(
    initial
      ? Object.entries(initial.specifications).map(([k, v]) => `${k}:${v}`).join("\n")
      : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  /* ---------- Image upload ---------- */
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setError(`Maximum of ${MAX_IMAGES} images reached`);
      return;
    }
    if (list.length > remaining) {
      setError(`You can only add ${remaining} more image${remaining === 1 ? "" : "s"}`);
      return;
    }

    for (const f of list) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported image (JPG, PNG, WebP, AVIF only)`);
        return;
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" is too large (max 5 MB)`);
        return;
      }
    }

    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set("images", [...form.images, ...data.urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    set("images", form.images.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const next = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("images", next);
  }

  /* ---------- Submit ---------- */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.images.length) {
      setError("Add at least one image");
      return;
    }

    const specs: Record<string, string> = {};
    specsText.split("\n").forEach((line) => {
      const [k, ...rest] = line.split(":");
      if (k && rest.length) specs[k.trim()] = rest.join(":").trim();
    });

    const payload = {
      ...form,
      price: Number(form.price),
      discount: Number(form.discount),
      stock: Number(form.stock),
      images: form.images,
      keywords: keywordsText.split(",").map((s) => s.trim()).filter(Boolean),
      specifications: specs,
      slug: undefined,
    };

    setSaving(true);
    try {
      const url = form._id ? `/api/admin/products/${form._id}` : "/api/admin/products";
      const method = form._id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const subcategories = getSubcategories(form.category);

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* --- Basic info --- */}
      <div className="space-y-4 rounded border border-line bg-surface p-6">
        <h2 className="text-lg">Basic info</h2>
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Input
          label="Short description"
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
        <div>
          <label className="label">Full description</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="input resize-y"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="SKU"
            required
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
          />

          <div>
            <label className="label">Category</label>
            <select
              required
              value={form.category}
              onChange={(e) => {
                set("category", e.target.value);
                set("subcategory", "");
              }}
              className="input"
            >
              <option value="">Select a category</option>
              {CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Subcategory</label>
            <select
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              className="input disabled:opacity-60"
              disabled={!subcategories.length}
            >
              <option value="">
                {subcategories.length ? "Select a subcategory" : "Select a category first"}
              </option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- Pricing --- */}
      <div className="space-y-4 rounded border border-line bg-surface p-6">
        <h2 className="text-lg">Pricing & stock</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Price ($)"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
          />
          <Input
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            value={form.discount}
            onChange={(e) => set("discount", Number(e.target.value))}
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            required
            value={form.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Active
          </label>
        </div>
      </div>

      {/* --- Images --- */}
      <div className="space-y-4 rounded border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg">Images</h2>
          <p className="text-xs text-ink-muted">
            {form.images.length} / {MAX_IMAGES} · JPG · PNG · WebP · AVIF · max 5 MB each
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive
              ? "border-accent bg-accent-soft"
              : "border-line-strong bg-surface-alt hover:border-accent"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            className="text-ink-muted"
          >
            <path
              d="M12 16V4M12 4l-4 4M12 4l4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm font-medium">
            {uploading
              ? "Uploading…"
              : dragActive
              ? "Drop images here"
              : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-ink-muted">
            Square images look best · recommended 900×900
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Preview grid */}
        {form.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {form.images.map((url, i) => (
              <div key={`${url}-${i}`} className="group">
                {/* Square preview — matches how it appears on cards */}
                <div className="relative aspect-square overflow-hidden rounded border border-line bg-surface-alt">
                  <Image
                    src={url}
                    alt={`Image ${i + 1}`}
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white opacity-0 shadow transition-opacity hover:bg-danger/90 group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Reorder */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="rounded border border-line px-1.5 py-0.5 text-ink-muted hover:border-ink hover:text-ink disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-muted"
                      aria-label="Move left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === form.images.length - 1}
                      className="rounded border border-line px-1.5 py-0.5 text-ink-muted hover:border-ink hover:text-ink disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-muted"
                      aria-label="Move right"
                    >
                      →
                    </button>
                  </div>
                  <span className="text-ink-faint">
                    {i === 0 ? "Primary" : `#${i + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Extra --- */}
      <div className="space-y-4 rounded border border-line bg-surface p-6">
        <h2 className="text-lg">Extra</h2>
        <Input
          label="Keywords (comma-separated)"
          value={keywordsText}
          onChange={(e) => setKeywordsText(e.target.value)}
        />
        <div>
          <label className="label">
            Specifications (one per line, format: Key:Value)
          </label>
          <textarea
            rows={4}
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            className="input resize-y"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-sm bg-danger/10 p-3 text-sm text-danger">{error}</p>
      )}

      <div className="flex gap-3">
        <button disabled={saving || uploading} className="btn btn-primary btn-lg">
          {saving ? "Saving…" : form._id ? "Update product" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}