"use client";

// FO · Footer layouts (docs/SECTION-MENU.md). Every footer keeps the "Concept website by Studio Northfold" line
// (CLAUDE.md house style). Addresses are generic, no phone numbers.
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { BendMarquee } from "../fx/text";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CREDIT = "Concept website by Studio Northfold";
const SOCIALS = ["Instagram", "YouTube", "Pinterest", "LinkedIn"];

const L = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <a href="#" onClick={(e) => e.preventDefault()} className={`w-fit text-[15px] text-[var(--sx-muted)] transition-colors duration-300 hover:text-[var(--sx-text)] ${className}`}>
    {children}
  </a>
);

/** A titled link column. */
function Col({ title, links, ...rest }: { title: string; links: string[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}>
      <p className="mb-4 text-[13px] font-[650] uppercase tracking-[0.14em]">{title}</p>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l}>
            <L>{l}</L>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small bottom row: © + credit left, extra items right. */
const Legal = ({ brand, children, className = "" }: { brand: string; children?: ReactNode; className?: string }) => (
  <div className={`flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px] text-[var(--sx-muted)] ${className}`}>
    <p>
      © 2026 {brand} · {CREDIT}
    </p>
    {children && <div className="flex flex-wrap gap-x-6 gap-y-2">{children}</div>}
  </div>
);

/** FO01 · Giant wordmark cropped by the bottom edge, three link columns + a short line above it. */
function FO01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="pt-[clamp(72px,8vw,120px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <p data-m-text className="max-w-[30ch] text-[clamp(18px,1.5vw,22px)] leading-snug md:col-span-5">
          Sugar-free energy, brewed with green tea and real fruit. Cold in 400+ cafés.
        </p>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          <Col data-m-card title="Shop" links={["All flavours", "Starter box", "Subscriptions", "Gift cards"]} />
          <Col data-m-card title="Brand" links={["Our story", "Ingredients", "Athletes", "Journal"]} />
          <Col data-m-card title="Help" links={["Delivery", "Returns", "Wholesale", "Contact"]} />
        </div>
      </div>
      <Legal brand="Voltline" className="mt-[clamp(48px,6vw,88px)] border-t border-[var(--sx-line)] pt-6">
        {SOCIALS.slice(0, 3).map((s) => (
          <L key={s} className="text-[13px]">
            {s}
          </L>
        ))}
      </Legal>
      {/* the wordmark sits half below the section edge: the bottom of the letters is cropped */}
      <div className="-mb-[0.24em] mt-4 overflow-hidden text-[clamp(88px,27vw,520px)]">
        <H className="whitespace-nowrap text-center text-[1em] leading-[0.8] text-[var(--sx-accent)]">Voltline</H>
      </div>
    </Sec>
  );
}

/** FO02 · Mega sitemap: five link columns with a hairline grid, then a small legal row. */
function FO02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const cols: [string, string[]][] = [
    ["Living", ["Sofas", "Lounge chairs", "Coffee tables", "Shelving", "Rugs"]],
    ["Dining", ["Tables", "Chairs", "Benches", "Sideboards"]],
    ["Bedroom", ["Beds", "Bedside tables", "Wardrobes", "Linen"]],
    ["Studio", ["Our makers", "Teak & cane", "Journal", "Trade program"]],
    ["Service", ["Delivery", "Assembly", "Care guides", "Warranty", "Contact"]],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="pt-[clamp(72px,8vw,120px)] pb-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--sx-line)] pb-[clamp(28px,3vw,44px)]">
        <H className="text-[clamp(40px,4.6vw,72px)]">Hallow &amp; Teak</H>
        <P className="max-w-[40ch]">Solid-wood furniture, made slowly by twelve workshops in Kerala.</P>
      </div>
      <div className="grid grid-cols-2 border-b border-[var(--sx-line)] sm:grid-cols-3 lg:grid-cols-5">
        {cols.map(([t, links], k) => (
          <Col key={t} title={t} links={links} className={`py-[clamp(28px,3vw,44px)] pr-6 ${k ? "lg:border-l lg:border-[var(--sx-line)] lg:pl-[clamp(16px,2vw,32px)]" : ""}`} />
        ))}
      </div>
      <Legal brand="Hallow & Teak" className="pt-6">
        <L className="text-[13px]">Privacy</L>
        <L className="text-[13px]">Terms</L>
        <L className="text-[13px]">Cookies</L>
        <span>INR · English</span>
      </Legal>
    </Sec>
  );
}

/** FO03 · Newsletter strip across the top, then link columns + socials below. */
function FO03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => (e.preventDefault(), setDone(true));
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="pt-[clamp(56px,6vw,96px)] pb-10">
      <div data-m-card className="flex flex-wrap items-center justify-between gap-6 rounded-[var(--sx-radius)] bg-[var(--sx-accent)] p-[clamp(24px,3vw,44px)] text-[var(--sx-accent-text)]">
        <p className="sx-display max-w-[20ch] text-[clamp(28px,2.8vw,42px)] font-[700] leading-[1.02]">Tea notes, once a month.</p>
        <form onSubmit={submit} className="flex w-full max-w-[480px] items-center gap-2 rounded-full bg-[var(--sx-accent-text)] p-1.5 max-sm:flex-col max-sm:items-stretch max-sm:rounded-[20px]">
          <input type="email" required placeholder="you@email.com" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[16px] text-[var(--sx-text)] outline-none placeholder:text-[var(--sx-muted)]" />
          <button type="submit" className="sx-btn sx-btn-solid justify-center">
            {done ? "Subscribed ✓" : "Subscribe"}
          </button>
        </form>
      </div>
      <div className="mt-[clamp(48px,5vw,80px)] grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(32px,3vw,46px)]">Leaf &amp; Lantern</H>
          <P className="mt-3 max-w-[32ch]">First-flush teas from three family estates.</P>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-6">
          <Col title="Teas" links={["Darjeeling", "Nilgiri", "Green & white", "Tasting box"]} />
          <Col title="Learn" links={["Brewing guide", "Our estates", "Journal"]} />
          <Col title="Help" links={["Shipping", "Returns", "Contact"]} />
        </div>
        <div className="md:col-span-2">
          <p className="mb-4 text-[13px] font-[650] uppercase tracking-[0.14em]">Follow</p>
          <div className="flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a key={s} href="#" onClick={(e) => e.preventDefault()} aria-label={s} className="grid size-10 place-items-center rounded-full border border-[var(--sx-line)] text-[13px] font-[700] transition-colors duration-300 hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
                {s.slice(0, 2)}
              </a>
            ))}
          </div>
        </div>
      </div>
      <Legal brand="Leaf & Lantern" className="mt-[clamp(40px,5vw,72px)] border-t border-[var(--sx-line)] pt-6" />
    </Sec>
  );
}

/** FO04 · Minimal two columns: wordmark + one line left, a few links right; both blocks unfold from a corner. */
function FO04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(56px,6vw,96px)]">
      <div className="grid grid-cols-1 gap-10 border-t border-[var(--sx-line)] pt-[clamp(32px,4vw,56px)] md:grid-cols-2">
        <div data-m-card>
          <p className="sx-display text-[clamp(40px,4.4vw,68px)] leading-none">Maison Ombre</p>
          <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">Small-batch perfume, distilled in Kannauj and bottled by hand.</p>
        </div>
        <div data-m-card className="flex flex-wrap content-start gap-x-8 gap-y-3 md:justify-end">
          {["Fragrances", "Discovery set", "Stores", "Journal", "Contact", ...SOCIALS.slice(0, 2)].map((l) => (
            <L key={l} className="text-[16px] text-[var(--sx-text)]">
              {l}
            </L>
          ))}
        </div>
      </div>
      <Legal brand="Maison Ombre" className="mt-[clamp(40px,5vw,72px)]" />
    </Sec>
  );
}

/** FO05 · Big statement footer: a CTA sentence lights up word by word with the scroll, a button, links small below. */
function FO05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M20");
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="pt-[clamp(88px,11vw,180px)] pb-10">
      <H className="max-w-[18ch] text-[clamp(44px,6.4vw,112px)] leading-[1]">Good shoes should last longer than the trend.</H>
      <div data-m-card className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center gap-4">
        <Btn>Shop the Court Low</Btn>
        <Btn kind="ghost">Book a resole</Btn>
      </div>
      <div className="mt-[clamp(72px,9vw,140px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-6">
        <p className="sx-display text-[22px]">Fieldmark</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {["Men", "Women", "Care", "Stores", "Journal", ...SOCIALS.slice(0, 2)].map((l) => (
            <L key={l} className="text-[14px]">
              {l}
            </L>
          ))}
        </nav>
      </div>
      <Legal brand="Fieldmark" className="mt-6" />
    </Sec>
  );
}

/** FO06 · Footer with three image cards leading to deeper pages (Our story / Stores / Journal); photos uncover from a mask. */
function FO06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const cards = [
    ["Our story", "From one roaster in Coorg", 2],
    ["Stores", "Six cafés, three cities", 3],
    ["Journal", "Brew guides & origin trips", 0],
  ] as const;
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="pt-[clamp(72px,8vw,120px)] pb-10">
      <H className="text-[clamp(36px,4vw,60px)]">Keep exploring.</H>
      <div className="mt-[clamp(28px,3vw,48px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-3">
        {cards.map(([t, d, i]) => (
          <a key={t} href="#" onClick={(e) => e.preventDefault()} className="group relative block overflow-hidden rounded-[var(--sx-radius)]" data-cursor="Open">
            <Pic i={i} ratio="4/3" className="transition-transform duration-700 group-hover:scale-[1.03]" />
            <div data-m-text className="absolute inset-0 flex items-end justify-between gap-4 rounded-[var(--sx-radius)] bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,.6))] p-[clamp(18px,2vw,28px)] text-white">
              <span>
                <b className="block text-[clamp(20px,1.7vw,26px)] font-[650]">{t}</b>
                <span className="text-[14px] text-white/75">{d}</span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform duration-500 group-hover:translate-x-1">→</span>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-[clamp(48px,5vw,80px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-6">
        <p className="sx-display text-[24px] font-[700]">Roastwell</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {["Beans", "Gear", "Subscriptions", "Wholesale", "Contact", ...SOCIALS.slice(0, 2)].map((l) => (
            <L key={l} className="text-[14px]">
              {l}
            </L>
          ))}
        </nav>
      </div>
      <Legal brand="Roastwell" className="mt-6" />
    </Sec>
  );
}

/** FO07 · Info footer: studio address, opening hours, stockists and a drawn map placeholder; lines slide up from masks. */
function FO07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="pt-[clamp(72px,8vw,120px)] pb-10">
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7">
          <div>
            <p className="mb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Studio</p>
            <p data-m-text className="text-[16px] leading-relaxed text-[var(--sx-muted)]">
              Cocoa Room
              <br />
              Studio 4, Indiranagar
              <br />
              Bengaluru
            </p>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Open</p>
            <p data-m-text className="text-[16px] leading-relaxed text-[var(--sx-muted)]">
              Tue–Fri · 11–8
              <br />
              Sat–Sun · 10–9
              <br />
              Mondays closed
            </p>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Stockists</p>
            <p data-m-text className="text-[16px] leading-relaxed text-[var(--sx-muted)]">
              Mumbai · Pune
              <br />
              Delhi · Goa
              <br />
              Kochi · Jaipur
            </p>
          </div>
          <div className="sm:col-span-3">
            <H className="text-[clamp(40px,4.6vw,72px)]">Bean to bar, two streets away.</H>
            <P className="mt-4 max-w-[44ch]">Drop in for a free tasting flight of five single-origin bars, made on the stone grinder you can see from the counter.</P>
          </div>
        </div>
        {/* drawn map placeholder: street grid + river + pin (no real map, no real address) */}
        <div data-m-card className="relative min-h-[300px] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] lg:col-span-5">
          <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent_0_46px,var(--sx-line)_46px_48px),repeating-linear-gradient(90deg,transparent_0_62px,var(--sx-line)_62px_64px)]" />
          <div className="absolute -left-[10%] top-[58%] h-[14%] w-[130%] -rotate-[14deg] bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)]" />
          <div className="absolute left-[22%] top-0 h-full w-[10px] rotate-[8deg] bg-[color-mix(in_srgb,var(--sx-text)_10%,transparent)]" />
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-full">
            <span className="block size-12 rounded-full rounded-br-none bg-[var(--sx-accent)] shadow-[0_10px_30px_-8px_var(--sx-accent)] [transform:rotate(45deg)]" />
            <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sx-accent-text)]" />
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-[var(--sx-bg)] px-4 py-2 text-[13px] font-[600]">Cocoa Room · Studio 4</div>
        </div>
      </div>
      <Legal brand="Cocoa Room" className="mt-[clamp(48px,6vw,88px)] border-t border-[var(--sx-line)] pt-6">
        {SOCIALS.slice(0, 2).map((s) => (
          <L key={s} className="text-[13px]">
            {s}
          </L>
        ))}
        <L className="text-[13px]">hello@cocoaroom.example</L>
      </Legal>
    </Sec>
  );
}

/** FO08 · Marquee footer: a slow brand-word marquee that bends with scroll speed (BendMarquee = M44), socials + legal. */
function FO08() {
  return (
    <Sec theme="ink" font="wide" full className="pt-[clamp(56px,6vw,96px)] pb-10">
      <div className="border-y border-[var(--sx-line)] text-[clamp(56px,9vw,160px)] leading-none [&_.font-display]:font-[800] [&_.font-display]:[font-family:var(--sx-display-font)]">
        <BendMarquee words={["Glow Theory", "Serums", "Spf daily", "Clean actives"]} />
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-10 px-[clamp(20px,5vw,96px)] md:grid-cols-12">
        <p className="max-w-[34ch] text-[clamp(17px,1.4vw,21px)] leading-snug md:col-span-5">Skincare with five ingredients or fewer, tested on sensitive skin.</p>
        <div className="flex flex-wrap gap-x-8 gap-y-3 md:col-span-7 md:justify-end">
          {SOCIALS.map((s) => (
            <a key={s} href="#" onClick={(e) => e.preventDefault()} className="sx-btn-link">
              {s} ↗
            </a>
          ))}
        </div>
      </div>
      <Legal brand="Glow Theory" className="mt-[clamp(40px,5vw,72px)] border-t border-[var(--sx-line)] px-[clamp(20px,5vw,96px)] pt-6">
        <L className="text-[13px]">Privacy</L>
        <L className="text-[13px]">Terms</L>
      </Legal>
    </Sec>
  );
}

export const FOOTER: SectionDef[] = [
  { code: "FO01", name: "Giant cropped wordmark + 3 link columns", motion: "M12", C: FO01 },
  { code: "FO02", name: "Mega sitemap, 5 columns + legal row", motion: "M23", C: FO02 },
  { code: "FO03", name: "Newsletter strip + columns + socials", motion: "M6", C: FO03 },
  { code: "FO04", name: "Minimal two-column footer", motion: "M18", C: FO04 },
  { code: "FO05", name: "Big statement footer", motion: "M20", C: FO05 },
  { code: "FO06", name: "Footer with 3 image cards", motion: "M1", C: FO06 },
  { code: "FO07", name: "Info footer: address, hours, stockists, map", motion: "M23", C: FO07 },
  { code: "FO08", name: "Marquee footer + socials + legal", motion: "M44", C: FO08 },
];
