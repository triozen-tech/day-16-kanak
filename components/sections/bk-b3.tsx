"use client";

// BK · Booking layouts (docs/SECTION-MENU.md), batch 3. House style: no phone numbers or real addresses; invented
// venue and people. Every loop stops in ?static=1.
import { useRef } from "react";
import { ShimmerButton } from "../fx/more";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const BK_CSS = `.bk3-glow{animation:bk3-glow 5.2s ease-in-out infinite alternate}@keyframes bk3-glow{from{transform:translate(-18%,-10%) scale(1)}to{transform:translate(22%,14%) scale(1.25)}}
.bk3-glow2{animation:bk3-glow2 3.6s ease-in-out infinite alternate}@keyframes bk3-glow2{from{opacity:.35;transform:translate(10%,30%)}to{opacity:.85;transform:translate(-14%,-6%)}}
.bk3-dot{animation:bk3-dot 1.4s ease-in-out infinite}@keyframes bk3-dot{0%,100%{opacity:1;scale:1}50%{opacity:.35;scale:.6}}
.is-static .bk3-glow,.is-static .bk3-glow2,.is-static .bk3-dot{animation:none}
html.is-static {.bk3-glow,.bk3-glow2,.bk3-dot{animation:none}}`;

// ── BK04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const CONTACT = [
  { k: "Phone", v: "Host desk, noon to 11 pm", s: "Ask for a call back from the app" },
  { k: "Email", v: "tables@kokumhouse.example", s: "Replies within the hour" },
  { k: "Hours", v: "Tue to Sun · 7 pm – 1 am", s: "Kitchen closes at 11.30 pm" },
];
const FIELDS = [
  { k: "Name", v: "Ira Menon" },
  { k: "Email", v: "ira.menon@inbox.example" },
  { k: "Phone", v: "Mobile number" },
  { k: "Guests", v: "4 guests", sel: true },
  { k: "Date", v: "Sat, 17 Oct", sel: true },
  { k: "Time", v: "8.30 pm", sel: true },
];

/** BK04 · Table booking split: a 4-col contact column (phone, email, hours stacked, lines slide up from masks) and an
 *  8-col two-column reservation form (Name, Email, Phone, Guests, Date, Time) ending in a full-width shimmering
 *  Reserve button. A slow warm glow drifts behind the contact column so the section never sits still. */
function BK04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const field = "mt-2 flex w-full items-center justify-between rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-5 py-4 text-[16px]";
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e0a25a", ["--accent" as string]: "#e0a25a" }}>
      <style>{BK_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="relative isolate overflow-hidden rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(28px,3vw,48px)] md:col-span-4">
          <div aria-hidden className="bk3-glow absolute -left-1/4 -top-1/4 -z-10 aspect-square w-[130%] rounded-full bg-[radial-gradient(closest-side,rgba(224,162,90,.32),transparent)]" />
          <div aria-hidden className="bk3-glow2 absolute -bottom-1/3 -right-1/3 -z-10 aspect-square w-[110%] rounded-full bg-[radial-gradient(closest-side,rgba(181,80,42,.35),transparent)]" />
          <H className="text-[clamp(40px,4vw,68px)]">A table at Kokum.</H>
          <P className="mt-5 max-w-[30ch]">Coastal small plates, a long bar and a record player. Twelve tables, booked a week ahead.</P>
          <div className="mt-[clamp(32px,4vw,56px)] divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
            {CONTACT.map((c) => (
              <div key={c.k} className="py-5">
                <p data-m-text className="text-[12px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{c.k}</p>
                <p data-m-text className="mt-2 text-[clamp(17px,1.4vw,21px)] font-[600]">{c.v}</p>
                <p data-m-text className="mt-1 text-[14px] text-[var(--sx-muted)]">{c.s}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-3 text-[14px] text-[var(--sx-muted)]">
            <span className="bk3-dot inline-block h-2.5 w-2.5 rounded-full bg-[#5fd08a]" />3 tables left this Saturday
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--sx-line)] pb-6">
            <H as="h3" className="text-[clamp(28px,2.6vw,42px)]">Reserve a table</H>
            <p data-m-text className="text-[14px] text-[var(--sx-muted)]">Tasting menu ₹3,800 a head · à la carte from ₹650</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.k} data-m-card className="block text-[13px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
                {f.k}
                <span className={`${field} normal-case tracking-normal ${f.sel ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
                  {f.v}
                  {f.sel && <span className="text-[var(--sx-accent)]">▾</span>}
                </span>
              </label>
            ))}
          </div>
          <label data-m-card className="mt-6 block text-[13px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
            A note for the kitchen
            <span className={`${field} min-h-[96px] items-start normal-case tracking-normal text-[var(--sx-muted)]`}>Allergies, a birthday, a window seat…</span>
          </label>
          <ShimmerButton className="mt-8 w-full py-5! text-[17px]">Reserve · Saturday 8.30 pm for 4</ShimmerButton>
          <p className="mt-4 text-center text-[13px] text-[var(--sx-muted)]">No deposit for parties under six. Free to cancel until 4 pm on the day.</p>
        </form>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BK04", name: "Table booking split: contact + form", motion: "M23", C: BK04 }];
