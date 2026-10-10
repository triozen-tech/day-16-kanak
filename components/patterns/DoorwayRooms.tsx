"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

/**
 * Walk-through rooms (first built for an electronics-showroom site).
 *
 *  <RoomLights base={{ "--bg": "#f3f4f6", "--text": "#111" }} />   once per page
 *  <DoorwayRoom id="computers" label="Computers" room="Room 01" photo=… glow="#2f6bff"
 *               vars={{ "--bg": "#e6efff", "--text": "#0a1633" }}> …content… </DoorwayRoom>
 *  <ZoneMark vars={base} label="Deals" />   back to the base light before the next plain section
 *
 * DoorwayRoom: the room photo is pinned behind the section and first seen (clear) through a tall lit doorway;
 * scrolling opens the doorway until the photo fills the screen. When it is open, RoomLights fades the CSS
 * colour variables on <html> to the room's `vars`, so the whole page takes that room's light, and fires
 * a "room:change" event ({ id, label }) for a nav/dock (see FloorDock).
 * Keep text readable with a soft gradient behind the text blocks, not by washing the photo.
 */

type Vars = Record<string, string>;

export function RoomLights({ base }: { base: Vars }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const marks = Array.from(document.querySelectorAll<HTMLElement>("[data-room-vars]"));
    const set = (vars: Vars, id: string, label: string) => {
      gsap.to(document.documentElement, { ...vars, duration: 1.1, ease: "power2.inOut", overwrite: "auto" });
      window.dispatchEvent(new CustomEvent("room:change", { detail: { id, label } }));
    };
    const read = (el?: HTMLElement) =>
      el ? { vars: JSON.parse(el.dataset.roomVars!) as Vars, id: el.dataset.roomId ?? "", label: el.dataset.roomLabel ?? "" } : { vars: base, id: "", label: "" };
    const triggers = marks.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        onEnter: () => {
          const z = read(el);
          set(z.vars, z.id, z.label);
        },
        onLeaveBack: () => {
          const z = read(marks[i - 1]);
          set(z.vars, z.id, z.label);
        },
      }),
    );
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      triggers.forEach((t) => t.kill());
    };
  }, [base]);
  return null;
}

/** An invisible point on the page where the light changes (e.g. back to the base colours). */
export function ZoneMark({ vars, id = "", label = "", offset = "0vh" }: { vars: Vars; id?: string; label?: string; offset?: string }) {
  return <div data-room-vars={JSON.stringify(vars)} data-room-id={id} data-room-label={label} className="pointer-events-none absolute left-0 h-px w-px" style={{ top: offset }} />;
}

const DOOR = 60; // vh of scroll to open the door

export function DoorwayRoom({
  id,
  label,
  room,
  photo,
  glow,
  vars,
  shade,
  children,
}: {
  id: string;
  label: string;
  room?: string;
  photo: string;
  glow: string;
  vars: Vars;
  shade?: string;
  children: ReactNode;
}) {
  const outer = useRef<HTMLElement>(null);
  const clip = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const sign = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const shadeEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const state = { p: 0 };
    const draw = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const doorW = Math.min(H * 0.7 * 0.52, W * 0.66);
      const k = 1 - gsap.parseEase("power2.inOut")(state.p);
      const top = H * 0.2 * k;
      const bottom = H * 0.1 * k;
      const side = ((W - doorW) / 2) * k;
      clip.current!.style.clipPath = `inset(${top}px ${side}px ${bottom}px ${side}px)`;
      Object.assign(frame.current!.style, { top: `${top}px`, bottom: `${bottom}px`, left: `${side}px`, right: `${side}px`, opacity: String(Math.min(1, k * 1.4)) });
      Object.assign(sign.current!.style, { top: `${top}px`, opacity: String(Math.max(0, 1 - state.p * 2.5)) });
      if (shadeEl.current) shadeEl.current.style.opacity = String(state.p);
    };
    draw();
    const ctx = gsap.context(() => {
      gsap.to(state, { p: 1, ease: "none", onUpdate: draw, scrollTrigger: { trigger: outer.current, start: "top top", end: `+=${DOOR}%`, scrub: 0.3 } });
      gsap.fromTo(img.current, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: outer.current, start: "top bottom", end: `top -${DOOR}%`, scrub: 0.3 } });
    }, outer);
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={outer} id={id} className="relative">
      <div className="sticky top-0 -mb-[100vh] h-screen overflow-hidden">
        <div ref={clip} className="absolute inset-0 overflow-hidden">
          <img ref={img} src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {shade && <div ref={shadeEl} className="absolute inset-0" style={{ background: shade }} />}
        </div>
        <div ref={frame} className="pointer-events-none absolute" style={{ border: `2px solid ${glow}`, boxShadow: `0 0 40px ${glow}, inset 0 0 24px ${glow}66`, opacity: 0 }} />
        <div ref={sign} className="pointer-events-none absolute inset-x-0 flex -translate-y-[calc(100%+22px)] flex-col items-center gap-2 text-center text-fg" style={{ opacity: 0 }}>
          {room && <span className="text-[12px] tracking-[0.3em] text-muted uppercase">{room}</span>}
          <span className="font-display text-[clamp(22px,2.4vw,38px)]">{label}</span>
        </div>
      </div>
      <div className="relative z-[1]">
        <div className="relative h-[150vh]">
          <ZoneMark vars={vars} id={id} label={label} offset="112vh" />
        </div>
        {children}
      </div>
    </section>
  );
}
