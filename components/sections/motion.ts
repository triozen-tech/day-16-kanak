"use client";

// One hook gives any SECTION-MENU layout its Motion-map move by code (docs/MOTION-MENU.md). Mark the parts with data
// attributes and pick a code:
//   data-m-head (headings) · data-m-text (paragraphs) · data-m-img (pictures) · data-m-card (cards / tiles)
//   data-m-col (columns that drift) · data-m-num (numbers: final value in the text) · data-m-product (product art)
// Codes implemented here: M1 M6 M12 M13 M18 M20 M23 M31 M32 M34 M3. Others (M40 M41 M44 M48 M49 M51 M57 M60–M64 …)
// come as components from components/fx. Everything plays once on entering (or scrubs), never needs hover, and does
// nothing in ?static=1 (the markup already shows the final state).
import { useEffect } from "react";
import { gsap, prefersReducedMotion, SplitText } from "@/lib/gsap";

export type SectionMotion = "M1" | "M3" | "M6" | "M12" | "M13" | "M18" | "M20" | "M23" | "M31" | "M32" | "M34";

export function useSectionMotion(root: React.RefObject<HTMLElement | null>, code: SectionMotion) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(s));
    const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
    const ctx = gsap.context(() => {
      switch (code) {
        case "M1": // curtain reveal in mask: pictures uncover from the bottom while scaling down
          q("[data-m-img]").forEach((im, i) => {
            gsap.fromTo(im, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.2, ease: "power4.inOut", delay: i * 0.12, scrollTrigger: once });
            gsap.fromTo(im.querySelector("img"), { scale: 1.2 }, { scale: 1, duration: 1.6, ease: "power3.out", delay: i * 0.12, scrollTrigger: once });
          });
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.3, scrollTrigger: once });
          break;
        case "M6": // text rise from blur (words)
          q("[data-m-head], [data-m-text]").forEach((t, i) => {
            const s = SplitText.create(t, { type: "words" });
            gsap.from(s.words, { y: 34, filter: "blur(10px)", opacity: 0, duration: 0.9, ease: "power2.out", stagger: 0.04, delay: i * 0.15, scrollTrigger: once });
          });
          gsap.from(q("[data-m-img], [data-m-card], [data-m-product]"), { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.3, scrollTrigger: once });
          break;
        case "M12": // letters pop out of a mask (short loud headings)
          q("[data-m-head]").forEach((t) => {
            const s = SplitText.create(t, { type: "words,chars", mask: "chars" });
            gsap.from(s.chars, { yPercent: 110, duration: 0.8, ease: "power4.out", stagger: 0.022, scrollTrigger: once });
          });
          gsap.from(q("[data-m-text], [data-m-card], [data-m-img], [data-m-product]"), { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.35, scrollTrigger: once });
          break;
        case "M13": // image scale-down inside an opening frame (scrubbed)
          q("[data-m-img]").forEach((im) => {
            gsap.fromTo(im, { clipPath: "inset(10% 8% round 28px)" }, { clipPath: "inset(0% 0% round 18px)", ease: "none", scrollTrigger: { trigger: im, start: "top bottom", end: "center center", scrub: true } });
            gsap.fromTo(im.querySelector("img"), { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im, start: "top bottom", end: "center center", scrub: true } });
          });
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M18": // clip-path corner grow (cards unfold from a corner)
          gsap.fromTo(
            q("[data-m-card]"),
            { clipPath: "polygon(0 0, 0 0, 0 0, 0 0)" },
            { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: once },
          );
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M20": // scroll-lit statement: words light up one by one with the scroll
          q("[data-m-head]").forEach((t) => {
            const s = SplitText.create(t, { type: "words" });
            gsap.fromTo(s.words, { opacity: 0.18 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: t, start: "top 80%", end: "bottom 35%", scrub: true } });
          });
          gsap.from(q("[data-m-text], [data-m-img], [data-m-card]"), { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M23": // line-by-line mask slide (paragraphs + headings by lines)
          q("[data-m-head], [data-m-text]").forEach((t, i) => {
            const s = SplitText.create(t, { type: "lines", mask: "lines" });
            gsap.from(s.lines, { yPercent: 105, duration: 0.9, ease: "power4.out", stagger: 0.1, delay: i * 0.12, scrollTrigger: once });
          });
          gsap.from(q("[data-m-img], [data-m-card], [data-m-product]"), { opacity: 0, scale: 0.96, duration: 1.1, ease: "power3.out", stagger: 0.08, delay: 0.2, scrollTrigger: once });
          break;
        case "M31": // 3D tilt-in from depth (scrubbed)
          gsap.set(el, { perspective: 1200 });
          gsap.fromTo(q("[data-m-card], [data-m-img]"), { rotationX: 28, y: 90, opacity: 0.2, transformOrigin: "50% 100%" }, { rotationX: 0, y: 0, opacity: 1, ease: "none", stagger: 0.05, scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: true } });
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M32": // masonry drift: columns move at different speeds, alternating directions (scrubbed)
          q("[data-m-col]").forEach((c, i) => {
            const amt = i % 2 ? -8 : 8;
            gsap.fromTo(c, { yPercent: amt }, { yPercent: -amt, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
          });
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M34": // snap-in tiles: tiles fly in from different sides and lock into the grid
          q("[data-m-card]").forEach((c, i) => {
            const from = [
              { x: -80, y: 0, rotation: -4 },
              { x: 0, y: 90, rotation: 3 },
              { x: 80, y: 0, rotation: 4 },
              { x: 0, y: -70, rotation: -3 },
            ][i % 4];
            gsap.from(c, { ...from, opacity: 0, duration: 1, ease: "power3.out", delay: i * 0.08, scrollTrigger: once });
          });
          gsap.from(q("[data-m-head], [data-m-text]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
          break;
        case "M3": // number counter roll: numbers count up from 0 (text holds the final value for static mode)
          q("[data-m-num]").forEach((n, i) => {
            const final = n.textContent ?? "";
            const m = final.match(/[\d.,]+/);
            if (!m) return;
            const target = parseFloat(m[0].replace(/,/g, ""));
            const dec = (m[0].split(".")[1] ?? "").length;
            const o = { v: 0 };
            gsap.to(o, {
              v: target,
              duration: 1.6,
              ease: "power3.out",
              delay: i * 0.12,
              scrollTrigger: once,
              onUpdate: () => (n.textContent = final.replace(m[0], o.v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }))),
              onComplete: () => (n.textContent = final),
            });
          });
          gsap.from(q("[data-m-head], [data-m-text], [data-m-card]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.07, scrollTrigger: once });
          break;
      }
    }, el);
    return () => ctx.revert();
  }, [root, code]);
}
