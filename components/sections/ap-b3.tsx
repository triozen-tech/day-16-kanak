"use client";

// AP · App layouts (docs/SECTION-MENU.md), batch 3. Platform icons are simple generic device drawings (never a
// platform's real logo). Loops stop in ?static=1.
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const AP_CSS = `.ap3-sheen{background:linear-gradient(115deg,transparent 35%,color-mix(in srgb,var(--sx-accent) 22%,transparent) 50%,transparent 65%) 0 0/300% 100%;animation:ap3-sheen 3.2s linear infinite;animation-delay:var(--dl,0s)}@keyframes ap3-sheen{from{background-position:120% 0}to{background-position:-20% 0}}
.is-static .ap3-sheen{animation:none;opacity:0}
html.is-static {.ap3-sheen{animation:none;opacity:0}}`;

/** Generic device glyphs (stroke drawings), one per platform. */
function Glyph({ k }: { k: number }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      {k === 0 && (
        <>
          <rect x="14" y="5" width="20" height="38" rx="5" {...s} />
          <path d="M21 9h6M22 38h4" {...s} />
        </>
      )}
      {k === 1 && (
        <>
          <rect x="9" y="7" width="30" height="34" rx="4" {...s} />
          <path d="M9 34h30M22 38h4" {...s} />
        </>
      )}
      {k === 2 && (
        <>
          <rect x="5" y="9" width="38" height="30" rx="4" {...s} />
          <path d="M5 17h38M10 13h1M14 13h1M18 13h1" {...s} />
        </>
      )}
      {k === 3 && (
        <>
          <rect x="9" y="10" width="30" height="22" rx="3" {...s} />
          <path d="M4 38h40l-3-6H7z" {...s} />
        </>
      )}
    </svg>
  );
}

// ── AP04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { t: "iPhone & iPad", v: "iOS 16 or later", meta: "4.9 · 12k ratings", cta: "Download for iOS", size: "84 MB" },
  { t: "Android", v: "Android 10 or later", meta: "4.8 · 9k ratings", cta: "Get it for Android", size: "61 MB" },
  { t: "Web player", v: "Any modern browser", meta: "No install needed", cta: "Open in browser", size: "Instant" },
  { t: "Mac & Windows", v: "macOS 13 · Windows 11", meta: "Menu-bar mini player", cta: "Download desktop", size: "112 MB" },
];

/** AP04 · Platform download cards row: four platform cards (iOS, Android, web, desktop), each with a device glyph, a
 *  requirement line and its own download button. The cards snap in from different sides; each then tilts toward the
 *  pointer, and hands-free they lean in a slow wave one after another. */
function AP04() {
  const r = useRef<HTMLDivElement>(null);
  const tilts = useRef<(HTMLDivElement | null)[]>([]);
  useSectionMotion(r, "M34");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ptr = { i: -1, x: 0, y: 0, at: 0 };
    const offs = tilts.current.map((c, i) => {
      if (!c) return () => {};
      const move = (e: PointerEvent) => {
        const b = c.getBoundingClientRect();
        ptr.i = i;
        ptr.x = (e.clientX - b.left) / b.width - 0.5;
        ptr.y = (e.clientY - b.top) / b.height - 0.5;
        ptr.at = performance.now();
      };
      c.addEventListener("pointermove", move);
      return () => c.removeEventListener("pointermove", move);
    });
    const cur = tilts.current.map(() => ({ x: 0, y: 0 }));
    let raf = 0;
    let on = false;
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      const live = now - ptr.at < 1200 && !document.documentElement.classList.contains("is-recording");
      tilts.current.forEach((c, i) => {
        if (!c) return;
        const auto = live ? 0 : 1;
        const tx = live && ptr.i === i ? ptr.x : auto * Math.sin(t * 1.4 - i * 0.9) * 0.5;
        const ty = live && ptr.i === i ? ptr.y : auto * Math.cos(t * 1.1 - i * 0.9) * 0.35;
        cur[i].x += (tx - cur[i].x) * 0.1;
        cur[i].y += (ty - cur[i].y) * 0.1;
        c.style.transform = `rotateY(${(cur[i].x * 16).toFixed(2)}deg) rotateX(${(-cur[i].y * 14).toFixed(2)}deg)`;
        c.style.setProperty("--gx", `${((cur[i].x + 0.5) * 100).toFixed(1)}%`);
        c.style.setProperty("--gy", `${((cur[i].y + 0.5) * 100).toFixed(1)}%`);
      });
      if (on) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      offs.forEach((f) => f());
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#8fd6c4", ["--sx-accent-text" as string]: "#06110e" }}>
      <style>{AP_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-7">Sleep sounds, on every screen.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Tidewell plays forty hours of rain, surf and slow piano. Start on your phone, carry on at your desk. Free for 14 days, then ₹249 a month.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] px-[clamp(0px,1vw,16px)] sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p, k) => (
          <div key={p.t} data-m-card className="[perspective:1000px]">
            <div
              ref={(n) => {
                tilts.current[k] = n;
              }}
              className="sx-card relative flex h-full flex-col overflow-hidden p-[clamp(22px,2.2vw,32px)] [transform-style:preserve-3d] will-change-transform"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),color-mix(in_srgb,var(--sx-accent)_18%,transparent),transparent_60%)]" />
              <div aria-hidden className="ap3-sheen pointer-events-none absolute inset-0" style={{ ["--dl" as string]: `${-k * 0.8}s` }} />
              <div className="relative flex items-start justify-between">
                <span className="grid h-20 w-20 place-items-center rounded-[20px] bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] text-[var(--sx-accent)]">
                  <Glyph k={k} />
                </span>
                <span className="rounded-full border border-[var(--sx-line)] px-3 py-1 text-[12px] text-[var(--sx-muted)]">{p.size}</span>
              </div>
              <p className="relative mt-[clamp(28px,3vw,44px)] text-[clamp(22px,1.8vw,28px)] font-[700] leading-tight">{p.t}</p>
              <p className="relative mt-2 text-[14px] text-[var(--sx-muted)]">{p.v}</p>
              <p className="relative mt-1 text-[14px] text-[var(--sx-muted)]">{p.meta}</p>
              <div className="relative mt-auto pt-[clamp(28px,3vw,44px)]">
              <a href="#" onClick={(e) => e.preventDefault()} className={`flex items-center justify-between gap-3 rounded-full px-5 py-3.5 text-[15px] font-[650] transition-colors ${k === 0 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)] hover:bg-[var(--sx-accent)] hover:text-[var(--sx-accent-text)]"}`}>
                {p.cta}
                <span aria-hidden>↓</span>
              </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-[14px] text-[var(--sx-muted)]">One account across all four · offline downloads on every plan · cancel any time</p>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "AP04", name: "Platform download cards row", motion: "M34", C: AP04 }];
