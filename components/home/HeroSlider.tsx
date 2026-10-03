"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  _id: string;
  name: string;
  price?: number;
  images?: string[];
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Autoplay
  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-line bg-surface-alt sm:aspect-[16/9] lg:aspect-[21/9]">
        <p className="text-sm text-ink-muted">Featured collection</p>
      </div>
    );
  }

  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchStartX.current = null;
      }}
      aria-roledescription="carousel"
    >
      {/* Sliding track */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide._id}
            aria-hidden={i !== index}
            className="relative aspect-[4/3] w-full shrink-0 sm:aspect-[16/9] lg:aspect-[21/9]"
          >
            {slide.images?.[0] ? (
              <Image
                src={slide.images[0]}
                alt={slide.name}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface-alt" />
            )}

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-16 lg:pt-20">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 text-white">
                  <p className="text-xs text-white/70">Featured product</p>
                  <p className="mt-1 truncate text-lg font-medium sm:text-xl lg:text-3xl">
                    {slide.name}
                  </p>
                  {typeof slide.price === "number" && (
                    <p className="mt-1 text-sm text-white/80 lg:text-base">
                      ${slide.price.toFixed(2)}
                    </p>
                  )}
                </div>

                <Link
                  href={`/products/${slide._id}`}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 lg:px-5 lg:py-2.5"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl leading-none text-white backdrop-blur transition hover:bg-black/60 sm:left-4 sm:h-11 sm:w-11"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl leading-none text-white backdrop-blur transition hover:bg-black/60 sm:right-4 sm:h-11 sm:w-11"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}