import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="font-display text-3xl">Product not found</h1>
      <p className="mt-3 text-ink-muted">
        This product may have been removed or is no longer available.
      </p>
      <Link href="/products" className="btn btn-primary btn-lg mt-8">
        Back to shop
      </Link>
    </div>
  );
}