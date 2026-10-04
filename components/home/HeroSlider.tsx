"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type HeroSlide = {
  _id: string;
  name: string;
  price?: number;
  images?: string[];
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const widthRef = useRef(0);
  const pointerId = useRef<number | null>(null);
  const moved = useRef(false);

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

  useEffect(() => {
    if (paused || dragging || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [paused, dragging, count]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    widthRef.current = e.currentTarget.clientWidth;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;

    if (!moved.current && Math.abs(dx) > 8) {
      moved.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    if (moved.current) setDragX(dx);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;

    const dx = e.clientX - startX.current;
    const threshold = Math.max(40, widthRef.current * 0.15);

    pointerId.current = null;
    setDragging(false);
    setDragX(0);

    if (dx <= -threshold) next();
    else if (dx >= threshold) prev();

    setTimeout(() => {
      moved.current = false;
    }, 0);
  };

  const handlePointerCancel = () => {
    pointerId.current = null;
    setDragging(false);
    setDragX(0);
    moved.current = false;
  };

  if (count === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center bg-surface-alt sm:h-[360px] sm:rounded-2xl sm:border sm:border-line lg:h-[420px]">
        <p className="text-sm text-ink-muted">Featured collection</p>
      </div>
    );
  }

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-none border-0 border-line bg-surface shadow-none sm:rounded-2xl sm:border sm:shadow-lg ${
        count > 1 ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (moved.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      <div
        className={`flex ${
          dragging ? "" : "transition-transform duration-700 ease-out"
        }`}
        style={{
          transform: `translate3d(calc(${-index * 100}% + ${dragX}px), 0, 0)`,
          willChange: "transform",
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide._id}
            aria-hidden={i !== index}
            className="relative h-[300px] w-full shrink-0 sm:h-[360px] lg:h-[420px]"
          >
            <Link
              href={`/products/${slide._id}`}
              className="block h-full w-full"
              draggable={false}
            >
              {slide.images?.[0] ? (
                <Image
                  src={slide.images[0]}
                  alt={slide.name}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  draggable={false}
                  className="pointer-events-none select-none object-cover object-center"
                />
              ) : (
                <div className="h-full w-full bg-surface-alt" />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-10 pt-8 sm:px-6 sm:pb-11 sm:pt-12 lg:px-8 lg:pb-12 lg:pt-16">
                <div className="min-w-0 text-white">
                  <p className="text-[11px] text-white/70 sm:text-xs">
                    Featured product
                  </p>
                  <p className="mt-0.5 truncate text-base font-medium sm:mt-1 sm:text-xl lg:text-2xl">
                    {slide.name}
                  </p>
                  {typeof slide.price === "number" && (
                    <p className="mt-0.5 text-xs text-white/80 sm:mt-1 sm:text-sm">
                      ${slide.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white backdrop-blur transition hover:bg-black/60 sm:left-4 sm:h-11 sm:w-11 sm:text-2xl"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white backdrop-blur transition hover:bg-black/60 sm:right-4 sm:h-11 sm:w-11 sm:text-2xl"
          >
            ›
          </button>
        </>
      )}

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}