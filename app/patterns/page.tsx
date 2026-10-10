import type { Metadata } from "next";
import SmoothScroll from "@/components/engine/SmoothScroll";
import Animations from "@/components/engine/Animations";
import Loader from "@/components/engine/Loader";
import Cursor from "@/components/engine/Cursor";
import NavPill from "@/components/patterns/NavPill";
import Ticker from "@/components/patterns/Ticker";
import VariantHero from "@/components/patterns/VariantHero";
import CurvedGallery from "@/components/patterns/CurvedGallery";
import Bento from "@/components/patterns/Bento";
import ExpandingPanels from "@/components/patterns/ExpandingPanels";
import ProductGrid from "@/components/patterns/ProductGrid";
import ProductShowcase from "@/components/patterns/ProductShowcase";
import PolaroidWall from "@/components/patterns/PolaroidWall";
import Faq from "@/components/patterns/Faq";
import WaveDivider from "@/components/patterns/WaveDivider";
import WordmarkFooter from "@/components/patterns/WordmarkFooter";
import StartLightsLoader from "@/components/patterns/StartLightsLoader";
import ColourLab, { PageGlow } from "@/components/patterns/ColourLab";
import SizePicker from "@/components/patterns/SizePicker";
import { DoorwayRoom, RoomLights, ZoneMark } from "@/components/patterns/DoorwayRooms";
import FloorDock from "@/components/patterns/FloorDock";
import BeamBento from "@/components/patterns/BeamBento";

// ─────────────────────────────────────────────────────────────
//  /patterns — a catalogue of the NEW pattern components with colour-placeholder demo images.
//  It uses the current site's colours + fonts. Not part of the filmed site.
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Pattern library",
  // a neutral tab icon (the site's own icon is set in site/Page.tsx)
  icons: { icon: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#888"/><rect x="8" y="8" width="7" height="7" rx="2" fill="#fff"/><rect x="17" y="8" width="7" height="7" rx="2" fill="#fff"/><rect x="8" y="17" width="16" height="7" rx="2" fill="#fff"/></svg>')}` },
};

// Demo images are plain colour placeholders drawn here (SVG data URIs), never a site's photos,
// so this page never shows an old brand and never breaks when a day's images are removed.
const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`)}`;
/** A flat "photo": one colour with a soft light. */
const photo = (c: string) =>
  svg(1200, 1500, `<defs><radialGradient id="l" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="1500" fill="${c}"/><rect width="1200" height="1500" fill="url(#l)"/>`);
/** A flat "cut-out product" on a transparent background (same shape in every colour, like same-angle product shots). */
const cutout = (c: string) =>
  svg(1600, 900, `<rect x="160" y="330" width="1280" height="360" rx="180" fill="${c}"/><rect x="420" y="210" width="620" height="220" rx="110" fill="${c}"/><rect x="160" y="620" width="1280" height="70" rx="35" fill="#000" fill-opacity=".18"/>`);
const photos = ["#c9b8a6", "#9fb4c7", "#b9c7a3", "#d4a5a5", "#a7a3c9", "#e0c38c", "#9cc5bd", "#c7a3bd", "#b0b0b0"].map(photo);
const BASE = { "--bg": "#f3f4f6", "--surface": "#ffffff", "--text": "#0c0f14", "--muted": "#596070", "--line": "#dfe2e8" };
const BLUE = { "--bg": "#e6efff", "--surface": "#f7faff", "--text": "#0a1633", "--muted": "#4a5a7a", "--line": "#c9d8f5" };
const NEON = { "--bg": "#0f0820", "--surface": "#1a1033", "--text": "#f3edff", "--muted": "#a99cc8", "--line": "#34265a" };
const CAR = { red: "#e0262c", green: "#22b35e", orange: "#f28a1d", gold: "#b8913f" };

function Label({ n, name, file }: { n: number; name: string; file: string }) {
  return (
    <div className="container-x flex items-center gap-4 border-t border-line pb-2 pt-10 text-xs text-muted">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">{n}</span>
      <span className="text-sm text-fg">{name}</span>
      <code className="opacity-70">components/patterns/{file}</code>
    </div>
  );
}

export default function Patterns() {
  return (
    <>
      <Loader text="PATTERNS" enabled />
      <SmoothScroll />
      <Animations />
      <Cursor />
      <PageGlow />
      <NavPill logo="Brand" links={[{ label: "Home", href: "#" }, { label: "Shop", href: "#" }, { label: "About", href: "#" }, { label: "Contact", href: "#" }]} cta={{ label: "Cart (2)", href: "#" }} />

      <VariantHero
        eyebrow="2026 Collection"
        lead="Drive the"
        text="Engineered for speed. Built for control. Own every road with the {name}."
        variants={[
          { name: "Rosso", color: "#e0262c", image: cutout(CAR.red) },
          { name: "Verde", color: "#22b35e", image: cutout(CAR.green) },
          { name: "Arancio", color: "#f28a1d", image: cutout(CAR.orange) },
        ]}
        features={[
          { title: "Lightning fast", text: "0–100 in 2.9 seconds" },
          { title: "Carbon body", text: "Light, stiff, silent" },
          { title: "Adaptive aero", text: "Grip that follows you" },
          { title: "Hand finished", text: "Every detail, by hand" },
        ]}
        specs={[
          { value: "850 hp", label: "Power" },
          { value: "340 km/h", label: "Top speed" },
          { value: "1,420 kg", label: "Weight" },
          { value: "8-speed", label: "Gearbox" },
        ]}
      />
      <Label n={1} name="Colour-switcher hero + pill nav" file="VariantHero.tsx · NavPill.tsx" />

      <Ticker items={["Free delivery over ₹5,000", "New season drop is live", "Easy 30-day returns", "Members get early access"]} />
      <Label n={2} name="Offer ticker" file="Ticker.tsx" />

      <CurvedGallery eyebrow="The collection" heading="Express your identity with our unique style" text="A row of images bent around a curve, drifting sideways." items={photos.map((p) => ({ image: p }))} />
      <Label n={3} name="Curved gallery" file="CurvedGallery.tsx" />

      <WaveDivider top="var(--bg)" bottom="var(--surface)" shape="wave" />
      <div className="bg-surface">
        <Bento
          eyebrow="Offers"
          heading="Worth discovering"
          items={[
            { image: photos[0], title: "The Grand Tour", tag: "New", text: "Seven days, three countries", size: "lg" },
            { image: photos[1], title: "Coastal", tag: "30% off", size: "wide" },
            { image: photos[2], title: "Studio" },
            { image: photos[3], title: "Night drive", tag: "Limited" },
            { image: photos[4], title: "Desert", size: "wide" },
            { image: photos[5], title: "Alpine", size: "wide" },
          ]}
        />
      </div>
      <WaveDivider top="var(--surface)" bottom="var(--bg)" shape="curve" />
      <Label n={4} name="Bento grid + wave dividers" file="Bento.tsx · WaveDivider.tsx" />

      <ExpandingPanels
        eyebrow="Moods"
        heading="Find your drive"
        items={["Candlelit", "Coastal", "Studio", "Night", "Desert", "Alpine"].map((t, i) => ({ image: photos[i], title: t, text: "Hover a strip — or wait, it opens the next one by itself." }))}
      />
      <Label n={5} name="Expanding panels" file="ExpandingPanels.tsx" />

      <div style={{ background: "#6b3a1f" }}>
        <ProductGrid
          card="pop"
          eyebrow="Best sellers"
          heading="Pick your colour"
          cta="Buy now"
          items={[
            { image: cutout(CAR.red), name: "Rosso Corsa", price: "₹2,40,000" },
            { image: cutout(CAR.green), name: "Verde Mantis", price: "₹2,40,000" },
            { image: cutout(CAR.orange), name: "Arancio Borealis", price: "₹2,55,000" },
            { image: cutout(CAR.gold), name: "Bronzo Sole", price: "₹2,70,000" },
          ]}
        />
      </div>
      <Label n={6} name="Product cards — pop style" file="ProductGrid.tsx card='pop'" />

      <ProductGrid
        card="photo"
        layout="row"
        eyebrow="Fresh from the studio"
        heading="New arrivals"
        items={photos.slice(0, 7).map((p, i) => ({
          image: p,
          name: ["Canyon Edit", "Coastline", "Studio Black", "Dusk Run", "Ivory", "Night Line", "Sand"][i],
          note: "Limited print · 1 of 50",
          price: ["₹12,800", "₹25,600", "₹29,500", "₹14,900", "₹21,900", "₹18,400", "₹9,900"][i],
          oldPrice: i % 3 === 0 ? "₹16,000" : undefined,
          badge: i === 0 ? "-20%" : i === 3 ? "Bestseller" : undefined,
        }))}
      />
      <Label n={7} name="Product cards — photo style, one row" file="ProductGrid.tsx card='photo' layout='row'" />

      <ProductShowcase
        items={["red", "green", "orange", "gold"].map((c, i) => ({
          image: cutout(CAR[c as keyof typeof CAR]),
          crumb: "Home › Cars",
          rating: "4.8 (212)",
          name: ["Rosso Corsa", "Verde Mantis", "Arancio Borealis", "Bronzo Sole"][i],
          price: ["₹2,40,000", "₹2,40,000", "₹2,55,000", "₹2,70,000"][i],
          sizes: ["S", "M", "L", "XL"],
          colors: ["#b3161b", "#1f7a3e", "#d9660f", "#8a6a3c"],
          text: "Changes by itself while on screen — the last one drifts away as a soft ghost.",
        }))}
      />
      <Label n={8} name="Product showcase" file="ProductShowcase.tsx" />

      <PolaroidWall
        eyebrow="Customer love"
        heading="Joy that travels with you"
        text="Real people, real moments — tilted polaroids that straighten on hover."
        items={photos.slice(0, 6).map((p, i) => ({ image: p, quote: ["Best weekend ever.", "Pure magic at sunset.", "Worth every rupee.", "I'd go again tomorrow.", "Unreal service.", "A dream drive."][i], name: ["Rahul K.", "Ananya S.", "Vikram R.", "Meera P.", "Arjun D.", "Kavya N."][i], place: ["Mumbai", "Goa", "Pune", "Delhi", "Chennai", "Hyderabad"][i] }))}
      />
      <Label n={9} name="Polaroid reviews" file="PolaroidWall.tsx" />

      <Faq
        eyebrow="Help"
        heading="Questions?"
        text="Everything you might want to know before you book."
        items={[
          { q: "How do I book a drive?", a: "Pick a journey, choose your dates and we'll call you within a day." },
          { q: "Do I need a special licence?", a: "No — a regular driving licence is enough." },
          { q: "Can I bring a friend?", a: "Yes, every car seats two." },
        ]}
      />
      <Label n={10} name="FAQ" file="Faq.tsx" />

      <div className="container-x">
        <div className="relative h-[min(70vh,620px)] overflow-hidden rounded-[var(--radius)] border border-line">
          <StartLightsLoader name="BRAND" inline />
        </div>
      </div>
      <Label n={11} name="Race-start loader (preview loops here; on a site it is the full-screen loader, &at= ready)" file="StartLightsLoader.tsx" />

      <ColourLab
        model="Model One"
        price="₹12,999"
        specs={[
          { label: "Weight", value: "212 g" },
          { label: "Drop", value: "8 mm" },
          { label: "Plate", value: "Carbon" },
          { label: "Foam", value: "Supercritical" },
        ]}
        colourways={[
          { id: "orange", name: "Orange", color: "#ff5a1f", image: cutout("#ff5a1f"), note: "Warm and loud" },
          { id: "blue", name: "Blue", color: "#6ec4ff", image: cutout("#6ec4ff"), note: "Cool and calm" },
          { id: "pink", name: "Pink", color: "#ff2fa6", image: cutout("#ff2fa6"), note: "Bright magenta" },
          { id: "white", name: "White", color: "#e6ebe4", image: cutout("#e6ebe4"), note: "Clean white" },
          { id: "lime", name: "Lime", color: "#c8ff1a", image: cutout("#c8ff1a"), note: "Neon green" },
        ]}
        cta={{ label: "Choose size", href: "#fit" }}
      />
      <Label n={12} name="Colour Lab: pinned colour switcher, the page glow follows (scroll through it)" file="ColourLab.tsx · PageGlow" />

      <SizePicker
        model="Model One · Lime"
        image={cutout("#c8ff1a")}
        sizes={["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"]}
        soldOut={["6.5", "11.5"]}
        low={{ "9": 3 }}
        sizeUnit="UK"
        price="₹12,999"
        demo={{ first: "8", size: "9", width: "Wide" }}
        measure={{ from: 6, base: 22.4, step: 0.85 }}
        perks={[
          { title: "Free delivery", text: "Across India, in 2–4 days" },
          { title: "30-day trial", text: "Not right? Send it back." },
          { title: "Free size exchange", text: "We pick up, you lace up" },
        ]}
      />
      <Label n={13} name="Hands-free size picker (plays a demo by itself on screen)" file="SizePicker.tsx" />

      <RoomLights base={BASE} />
      <FloorDock
        after="#pattern-rooms"
        stops={[
          { id: "room-a", label: "Room A", color: "#2f6bff" },
          { id: "room-b", label: "Room B", color: "#b56cff", textColor: "#0f0820" },
          { id: "after-rooms", label: "Back outside", color: "#ff5a1f", textColor: "#0c0f14" },
        ]}
      />
      <div id="pattern-rooms">
        <DoorwayRoom id="room-a" label="Room A" room="Room 01" photo={photo("#9fb4c7")} glow="#2f6bff" vars={BLUE}>
          <div className="container-x flex min-h-screen items-center">
            <h2 className="font-display text-[clamp(36px,5vw,80px)] text-fg">Walk into a room.</h2>
          </div>
        </DoorwayRoom>
        <DoorwayRoom id="room-b" label="Room B" room="Room 02" photo={photo("#3b2a5c")} glow="#b56cff" vars={NEON} shade="rgba(12,6,26,.55)">
          <div className="container-x flex min-h-screen flex-col justify-center gap-8 pb-[12vh]">
            <h2 className="font-display text-[clamp(36px,5vw,80px)] text-fg">Beam bento.</h2>
            <BeamBento
              items={[
                { image: cutout("#b56cff"), title: "Big tile", kind: "Featured", text: "Spans two rows on a laptop", price: "₹84,990" },
                { image: cutout("#9fb4c7"), title: "Tile two", kind: "Audio", price: "₹19,990" },
                { image: cutout("#e0c38c"), title: "Tile three", kind: "Speaker", price: "₹8,990" },
                { image: cutout("#9cc5bd"), title: "Tile four", kind: "Gaming", price: "₹49,990" },
                { image: cutout("#d4a5a5"), title: "Tile five", kind: "Earbuds", price: "₹6,990" },
              ]}
            />
          </div>
        </DoorwayRoom>
        <div id="after-rooms" className="relative bg-bg py-24 text-fg">
          <ZoneMark vars={BASE} id="after-rooms" label="Back outside" offset="-40vh" />
          <p className="container-x text-muted">The light returns to the base colours before this block shows.</p>
        </div>
      </div>
      <Label n={15} name="Walk-through rooms: doorway reveal + page light per room, floor dock, beam bento (tiles light up by themselves)" file="DoorwayRooms.tsx · FloorDock.tsx · BeamBento.tsx" />

      <WordmarkFooter
        name="Brand"
        logo="BRAND"
        tagline="A footer with the brand name set huge across the bottom."
        columns={[
          { title: "Shop", links: [{ label: "New in", href: "#" }, { label: "Bestsellers", href: "#" }] },
          { title: "Help", links: [{ label: "Shipping", href: "#" }, { label: "Returns", href: "#" }] },
          { title: "Follow", links: [{ label: "Instagram", href: "#" }] },
        ]}
        note="Concept website"
      />
      <Label n={16} name="Wordmark footer" file="WordmarkFooter.tsx" />
    </>
  );
}
