"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ScrubRoot } from "@/components/fx/shared";
import { BendMarquee, CurvedPathText, DrawRings, Odometer, ParticleText, ScrambleLine, ShineText } from "@/components/fx/text";
import { BeforeAfter, ClipDouble, Exploded, FlipGrid, MagneticButton, MorphShape, RackFocus, SkewGallery, SplitOpposite, StackCards, TiltCard3D } from "@/components/fx/layout";
import { DisplaceSwap, FilmGrain, Flowmap, GradientMesh, LiquidReveal, LiquidWipe, PixelDissolve, Ripple, RGBShift, ScrollBulge, ZoomBlur } from "@/components/fx/gl";
import {
  DiagonalWipe,
  FlickeringGrid,
  GlitchCut,
  GooeyCursor,
  IrisTransition,
  LightRays,
  MorphingWords,
  PixelLoader,
  Pixelate,
  PortalZoom,
  RapidLayers,
  ScrollBlurText,
  ShimmerButton,
  TypeShuffle,
} from "@/components/fx/more";
import {
  AtmosphericBleed,
  CutAndStamp,
  FadeThroughBlack,
  GlacialPin,
  InversionCut,
  PreloaderOverlap,
  ReticleWipe,
  StampPopDissolve,
  ThrownPath,
  VelocitySkewText,
  VignetteSpotlight,
} from "@/components/fx/more2";

// /lab: a live demo of every motion code from M38 on, every X6+ transition and every collected effect, each labelled.
// Two kinds of panel:
//  - "scrub": a tall section (220vh) with a sticky stage; the effect follows the scroll through it. Record mode scrolls
//    through it over `secs` (no holds, so nothing is ever still).
//  - "play": one screen; the effect plays by itself. Record mode passes it centred over `secs`.

type Kind = "scrub" | "play";

function Demo({ code, name, how, kind, secs = 2.6, children }: { code: string; name: string; how: string; kind: Kind; secs?: number; children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const label = (
    <header className="pointer-events-none absolute left-[clamp(16px,4vw,56px)] top-[clamp(70px,10vh,96px)] z-20 max-w-[min(520px,80vw)]">
      <p className="font-display text-[clamp(30px,4vw,56px)] font-[900] leading-none text-[var(--accent)]">{code}</p>
      <p className="mt-1 text-[clamp(17px,1.6vw,22px)] font-[650]">{name}</p>
      <p className="mt-1 text-[13px] text-white/60">{how}</p>
    </header>
  );
  if (kind === "scrub")
    return (
      <section ref={root} id={code.toLowerCase()} className="relative h-[220vh]" data-record-time="1.2" data-record-label={code}>
        <ScrubRoot.Provider value={root}>
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            {label}
            <div className="absolute inset-x-[clamp(16px,4vw,56px)] bottom-[6vh] top-[clamp(170px,26vh,230px)]">{children}</div>
          </div>
        </ScrubRoot.Provider>
        <div className="absolute bottom-0 left-0 h-px w-px" data-record-time={secs} data-record-align="bottom" data-record-label={`${code} end`} aria-hidden />
      </section>
    );
  return (
    <section id={code.toLowerCase()} className="relative h-[100svh] overflow-hidden" data-record-time={secs} data-record-align="center" data-record-label={code}>
      {label}
      <div className="absolute inset-x-[clamp(16px,4vw,56px)] bottom-[6vh] top-[clamp(170px,26vh,230px)]">{children}</div>
    </section>
  );
}

const fill = "h-full w-full";
const center = "grid h-full w-full place-items-center";

export default function LabPage() {
  useEffect(() => {
    if (prefersReducedMotion()) document.documentElement.classList.add("is-static");
  }, []);
  return (
    <main className="lab bg-[#05080f] text-[#eaf5ff]">
      <section className="relative grid h-[100svh] place-items-center px-6 text-center" data-record-time="0.6" data-record-label="Lab">
        {/* pure CSS light: moves from the very first paint, before the page's JavaScript wakes up */}
        <div className="lab-glow pointer-events-none absolute inset-0" aria-hidden />
        <FlickeringGrid className="absolute inset-0 opacity-60" />
        <BendMarquee words={["Reveal", "Scrub", "Shader", "Morph", "Flip"]} className="absolute inset-x-0 bottom-[6vh] text-[clamp(40px,6vw,90px)] font-[900] text-white/15" />
        <div className="relative">
          <p className="label text-white/50">Showreel kit · hidden lab (noindex)</p>
          <h1 className="fx-drift font-display mt-4 text-[clamp(56px,9vw,150px)] font-[900] leading-[0.9]">Motion lab</h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-white/65">Every new motion (M38+), transition (X6+), loader (I6) and collected effect, live. Codes match docs/MOTION-MENU.md and docs/DESIGN-MENU.md. Sources: docs/SOURCES.md.</p>
        </div>
      </section>

      {/* ---------- upgraded with GSAP plugins ---------- */}
      <Demo code="M8" name="Line draw (now DrawSVG)" how="DrawSVG draws three lines on; a spark keeps running along them" kind="play">
        <div className={center}>
          <DrawRings className="w-[min(900px,90%)] text-[#5cc8ff]" />
        </div>
      </Demo>
      <Demo code="M22" name="Scramble / decode (now ScrambleText)" how="ScrambleText lands each value left → right" kind="play">
        <div className="grid h-full content-center gap-4 text-[clamp(44px,8vw,120px)] font-[900] leading-none">
          <ScrambleLine text="80 MG CAFFEINE" className="font-display" />
          <ScrambleLine text="B3 · B6 · B12" className="font-display text-[var(--accent)]" duration={1.8} />
        </div>
      </Demo>

      {/* ---------- M38–M56 ---------- */}
      <Demo code="M38" name="Liquid image reveal" how="OGL shader: noisy wobbling edge, glowing rim · scrub" kind="scrub">
        <LiquidReveal className={`${fill} rounded-[18px]`} images={[1]} finalValue={1} />
      </Demo>
      <Demo code="M39" name="Text on a moving curved path" how="SVG textPath; curve breathes, text slides with time + scroll" kind="play">
        <CurvedPathText text="COLD BREW · SMALL BATCH" className={`${fill} text-[#eaf5ff]`} />
      </Demo>
      <Demo code="M40" name="Sticky stacking cards" how="each card slides over the last, which shrinks back and dims · scrub" kind="scrub" secs={3.4}>
        <StackCards
          items={[
            { title: "Origin", text: "Single-estate, hand picked." },
            { title: "Roast", text: "Slow drum, small batches." },
            { title: "Brew", text: "Twelve hours, cold." },
            { title: "Pour", text: "Over ice, no sugar." },
          ]}
        />
      </Demo>
      <Demo code="M41" name="Pinned horizontal gallery + speed skew" how="vertical scroll → sideways row; scroll speed skews the cards · scrub" kind="scrub" secs={3.4}>
        <SkewGallery />
      </Demo>
      <Demo code="M42" name="Split screen, opposite scroll" how="two columns travel in opposite directions · scrub" kind="scrub">
        <SplitOpposite />
      </Demo>
      <Demo code="M43" name="Pixelated → sharp" how="canvas 2D, image redrawn from big pixels to sharp (after Codrops ImagePixelLoading) · scrub" kind="scrub">
        <Pixelate i={2} />
      </Demo>
      <Demo code="M44" name="Marquee that bends with scroll speed" how="endless row; faster scroll = deeper arc · time + scroll" kind="play">
        <div className="grid h-full content-center">
          <BendMarquee words={["Cold", "Loud", "Awake", "Fresh", "Bold"]} className="text-[clamp(56px,9vw,140px)] font-[900]" />
        </div>
      </Demo>
      <Demo code="M45" name="Particle text" how="canvas dots fly in and form the word; they keep shimmering · scrub" kind="scrub">
        <ParticleText text="AWAKE" className={fill} />
      </Demo>
      <Demo code="M46" name="Scroll before/after slider" how="clip-path divider sweeps across with the scroll · scrub" kind="scrub">
        <BeforeAfter />
      </Demo>
      <Demo code="M47" name="Exploded product view" how="layers pull apart in depth; callout lines draw on (DrawSVG) · scrub" kind="scrub">
        <Exploded />
      </Demo>
      <Demo code="M48" name="Odometer number roll (full spin)" how="each digit column spins a full cycle to its value; replays on re-entry" kind="play">
        <div className="grid h-full content-center gap-2 text-[clamp(64px,12vw,180px)] font-[900] leading-none">
          <Odometer value="2,480" prefix="₹" className="font-display" />
          <Odometer value="98" suffix="%" className="font-display text-[var(--accent)]" />
        </div>
      </Demo>
      <Demo code="M49" name="Light sweep / shine" how="a bright band sweeps the type on a loop, faster while scrolling" kind="play">
        <div className="grid h-full content-center">
          <ShineText className="font-display text-[clamp(64px,11vw,170px)] font-[900] leading-none text-[#7f93a8]">PURE GOLD</ShineText>
        </div>
      </Demo>
      <Demo code="M50" name="Rack focus" how="background sharpens while the foreground softens, like a lens pulling focus · scrub" kind="scrub">
        <RackFocus />
      </Demo>
      <Demo code="M51" name="3D card tilt-rotate" how="follows the pointer; hands-free a slow figure-eight + moving glare" kind="play">
        <TiltCard3D />
      </Demo>
      <Demo code="M52" name="Animated gradient mesh" how="OGL shader: drifting colour fields (CSS fallback)" kind="play">
        <GradientMesh className={`${fill} rounded-[18px]`} />
      </Demo>
      <Demo code="M53" name="SVG shape morph" how="MorphSVG (loaded on demand): circle → diamond → star → square · scrub" kind="scrub">
        <div className={center}>
          <MorphShape className="h-[min(48vh,60vw)] w-[min(48vh,60vw)]" />
        </div>
      </Demo>
      <Demo code="M54" name="Flip layout morph (grid → detail)" how="Flip (loaded on demand): a tile grows into the detail view and back, by itself" kind="play" secs={3.2}>
        <FlipGrid />
      </Demo>
      <Demo code="M55" name="WebGL RGB shift on scroll speed" how="OGL: red/blue split along the scroll (three.js RGBShift idea)" kind="play">
        <RGBShift className={`${fill} rounded-[18px]`} images={[0]} />
      </Demo>
      <Demo code="M56" name="WebGL zoom-blur transition" how="OGL: A rushes into B through a radial blur (glfx / gl-transitions idea) · scrub" kind="scrub">
        <ZoomBlur className={`${fill} rounded-[18px]`} />
      </Demo>

      {/* ---------- transitions ---------- */}
      <Demo code="X6" name="Circle iris" how="clip-path circle opens from the centre · scrub" kind="scrub">
        <IrisTransition />
      </Demo>
      <Demo code="X7" name="Diagonal wipe" how="slanted edge sweeps across · scrub" kind="scrub">
        <DiagonalWipe />
      </Demo>
      <Demo code="X8" name="Pixel dissolve" how="OGL: A breaks into squares, B resolves (gl-transitions pixelize idea) · scrub" kind="scrub">
        <PixelDissolve className={`${fill} rounded-[18px]`} />
      </Demo>
      <Demo code="X9" name="RGB glitch cut" how="crossing the middle tears the frame into RGB slices for 0.45 s, then cuts" kind="scrub">
        <GlitchCut />
      </Demo>
      <Demo code="X10" name="Zoom into a window" how="a window in A grows while A rushes past the camera · scrub" kind="scrub">
        <PortalZoom />
      </Demo>
      <Demo code="X11" name="Shader liquid wipe" how="OGL: B pours over A along a rippling diagonal · scrub" kind="scrub">
        <LiquidWipe className={`${fill} rounded-[18px]`} />
      </Demo>

      <Demo code="X12" name="Fade through black" how="A fades to black, a held darkness (a light keeps it alive), B fades up · scrub" kind="scrub">
        <FadeThroughBlack />
      </Demo>
      <Demo code="X13" name="Inversion cut" how="B opens as the photographic negative and settles, tilting from 2° · scrub" kind="scrub">
        <InversionCut />
      </Demo>
      <Demo code="X14" name="Atmospheric bleed" how="a drifting haze rises over A, holds, clears onto B · scrub" kind="scrub">
        <AtmosphericBleed />
      </Demo>
      <Demo code="X15" name="Vignette spotlight" how="the edges close to a spotlight, cut, the vignette opens on B · scrub" kind="scrub">
        <VignetteSpotlight />
      </Demo>
      <Demo code="X16" name="Cut-and-stamp" how="a hard cut with a 2px jolt that settles at once · scrub" kind="scrub">
        <CutAndStamp />
      </Demo>
      <Demo code="X17" name="Lock-on reticle wipe" how="B opens inside a circle traced by an accent reticle (DrawSVG) · scrub" kind="scrub">
        <ReticleWipe />
      </Demo>
      <Demo code="X18" name="Stamp-pop dissolve" how="a short crossfade while a stamp pops 1 → 1.05 → 1 · scrub" kind="scrub">
        <StampPopDissolve />
      </Demo>

      {/* ---------- collected effects (docs/SOURCES.md) ---------- */}
      <Demo code="M57" name="Scroll blur typography" how="letters come into focus left → right (after Codrops ScrollBlurTypography)" kind="play">
        <div className="grid h-full content-center">
          <ScrollBlurText text="Slow mornings, sharp minds." className="text-[clamp(48px,7vw,110px)] font-[900]" />
        </div>
      </Demo>
      <Demo code="M58" name="Type shuffle" how="letters flicker through glyphs on colour cells, then settle (after Codrops TypeShuffle)" kind="play">
        <div className="grid h-full content-center">
          <TypeShuffle text="NEW DROP 07.10" className="text-[clamp(56px,9vw,140px)] font-[900] leading-none" />
        </div>
      </Demo>
      <Demo code="M59" name="Liquid morphing words" how="words melt into each other through a gooey threshold filter (after Magic UI)" kind="play">
        <MorphingWords words={["Bold", "Bright", "Cold", "Yours"]} className="h-full w-full text-[clamp(72px,13vw,200px)]" />
      </Demo>
      <Demo code="M60" name="Flickering grid background" how="canvas squares twinkle forever (after Magic UI)" kind="play">
        <div className="relative h-full w-full overflow-hidden rounded-[18px] border border-white/10">
          <FlickeringGrid className="absolute inset-0" />
          <p className="font-display absolute inset-0 grid place-items-center text-[clamp(48px,8vw,120px)] font-[900]">Signal</p>
        </div>
      </Demo>
      <Demo code="M61" name="Light rays background" how="soft beams from the top sway and breathe (after Magic UI)" kind="play">
        <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-[#070b16]">
          <LightRays className="absolute inset-0" />
          <p className="font-display absolute inset-x-0 bottom-[12%] text-center text-[clamp(44px,7vw,110px)] font-[900]">Into the light</p>
        </div>
      </Demo>
      <Demo code="M62" name="Double-image clip reveal" how="colour panel + image unfold with clip-path, image counter-scales (after Codrops)" kind="play">
        <ClipDouble i={3} />
      </Demo>
      <Demo code="M63" name="Rapid layers intro" how="colour and photo layers wipe in fast, ending on the title (after Codrops); loops here" kind="play" secs={3}>
        <RapidLayers />
      </Demo>
      <Demo code="I6" name="Pixel transition loader" how="cells cover the screen in a random wave, then clear from the centre (after Codrops); loops here" kind="play" secs={3}>
        <PixelLoader />
      </Demo>
      <Demo code="M64" name="Shimmer border button" how="a light spark runs round the border forever (after Magic UI)" kind="play">
        <div className={center}>
          <ShimmerButton className="text-[18px]">Shop the drop</ShimmerButton>
        </div>
      </Demo>
      <Demo code="M65" name="Gooey cursor trail" how="cells light under the pointer and melt together; scripted path in record mode (after Codrops)" kind="play">
        <div className="relative h-full w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#070b16]">
          <GooeyCursor className="absolute inset-0" />
        </div>
      </Demo>
      <Demo code="M66" name="Displacement-map swap" how="OGL: images melt into each other through a noise map, cycling by itself (after hover-effect)" kind="play" secs={3}>
        <DisplaceSwap className={`${fill} rounded-[18px]`} />
      </Demo>
      <Demo code="M67" name="Flowmap liquid trail" how="OGL Flowmap: the pointer (or a scripted path) drags the image like liquid (after curtains.js)" kind="play" secs={3}>
        <Flowmap className={`${fill} overflow-hidden rounded-[18px]`} images={[2]} />
      </Demo>
      <Demo code="M68" name="Scroll bulge" how="OGL: the picture bulges with scroll speed (after curtains.js scroll effect)" kind="play">
        <ScrollBulge className={`${fill} rounded-[18px]`} images={[3]} />
      </Demo>
      <Demo code="M69" name="Ripple" how="OGL: water rings spread from the centre on a loop (gl-transitions ripple idea)" kind="play">
        <Ripple className={`${fill} rounded-[18px]`} images={[1]} />
      </Demo>
      <Demo code="M70" name="Film grain + vignette" how="OGL: moving grain and breathing light (three.js FilmShader idea)" kind="play">
        <FilmGrain className={`${fill} rounded-[18px]`} images={[0]} />
      </Demo>
      <Demo code="M71" name="Magnetic button + text parallax" how="leans toward the pointer, label leans further; hands-free a slow orbit (after Codrops)" kind="play">
        <div className={center}>
          <MagneticButton className="text-[18px]">Get yours</MagneticButton>
        </div>
      </Demo>

      {/* ---------- ideas from MIT design skills (docs/SOURCES.md) ---------- */}
      <Demo code="M72" name="Glacial-then-sudden pin" how="60% slow linear drift through haze, then a 40% payoff reveal (power2.out) · scrub" kind="scrub" secs={3.4}>
        <GlacialPin />
      </Demo>
      <Demo code="M73" name="Velocity-skew type" how="letters skew and lift with damped scroll speed (capped 6° / 0.18em) + idle wave" kind="play">
        <div className="grid h-full content-center">
          <VelocitySkewText text="Speed you can feel." className="text-[clamp(52px,8vw,130px)] font-[900]" />
        </div>
      </Demo>
      <Demo code="M74" name="Thrown curved path (CSS)" how="typed @property --x/--y on separate keyframes = a curved thrown arc, no JS" kind="play">
        <ThrownPath />
      </Demo>
      <Demo code="I10" name="Preloader-to-hero overlap" how="counter ≤ 1.6 s, the plate wipes off while the title already rises (0.35 s overlap); loops here" kind="play" secs={3}>
        <PreloaderOverlap />
      </Demo>

      <section className="relative grid h-[60svh] place-items-center text-center" data-record-time="1.4" data-record-align="bottom" data-record-label="End">
        <FlickeringGrid className="absolute inset-0 opacity-60" />
        <BendMarquee words={["Never", "Frozen", "On", "Camera"]} className="absolute inset-x-0 top-[8%] text-[clamp(40px,6vw,90px)] font-[900] text-white/15" />
        <p className="fx-drift font-display relative text-[clamp(40px,6vw,90px)] font-[900]">End of lab</p>
      </section>
    </main>
  );
}
