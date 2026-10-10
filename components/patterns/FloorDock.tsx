"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

/**
 * Bottom floating dock that says where you are (first built for an electronics-showroom site, N7).
 * "You are in: <stop>" + the stops; the current one lights up in its own colour with a sliding pill.
 * Listens to the "room:change" event ({ id }) from DoorwayRooms/RoomLights. Appears once `after` has
 * scrolled past. Below lg: current stop + a full-screen "Map" sheet.
 */
export type DockStop = { id: string; label: string; color: string; textColor?: string };

export default function FloorDock({ stops, after, title = "You are in" }: { stops: DockStop[]; after?: string; title?: string }) {
  const [id, setId] = useState(stops[0]?.id);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const h = (e: Event) => {
      const next = (e as CustomEvent<{ id: string }>).detail.id;
      setId(stops.some((s) => s.id === next) ? next : stops[0]?.id);
    };
    window.addEventListener("room:change", h);
    return () => window.removeEventListener("room:change", h);
  }, [stops]);

  useEffect(() => {
    if (!after || prefersReducedMotion()) return;
    gsap.set(bar.current, { yPercent: 160, opacity: 0 });
    const st = ScrollTrigger.create({
      trigger: after,
      start: "bottom 80%",
      onEnter: () => gsap.to(bar.current, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" }),
      onLeaveBack: () => gsap.to(bar.current, { yPercent: 160, opacity: 0, duration: 0.5, ease: "power2.in" }),
    });
    return () => st.kill();
  }, [after]);

  const stop = stops.find((s) => s.id === id) ?? stops[0];

  useLayoutEffect(() => {
    const btn = list.current?.querySelector<HTMLElement>(`[data-stop="${id}"]`);
    if (!btn || !pill.current) return;
    gsap.to(pill.current, { x: btn.offsetLeft, width: btn.offsetWidth, backgroundColor: stop.color, duration: 0.6, ease: "power3.inOut" });
    list.current!.querySelectorAll<HTMLElement>("[data-stop]").forEach((el) => (el.style.color = el.dataset.stop === id ? (stop.textColor ?? "#fff") : ""));
  }, [id, stop]);

  return (
    <>
      <div ref={bar} className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-[#0c0f14]/92 p-1.5 text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)] backdrop-blur-md">
          <div className="flex min-w-[140px] items-center gap-3 px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: stop.color, boxShadow: `0 0 14px ${stop.color}` }} />
            <span className="flex flex-col leading-tight">
              <span className="text-[12px] text-white/60">{title}</span>
              <span className="text-[13px] font-semibold whitespace-nowrap">{stop.label}</span>
            </span>
          </div>
          <div ref={list} className="relative hidden items-center lg:flex">
            <span ref={pill} className="absolute left-0 top-0 h-full rounded-[6px]" style={{ width: 0 }} />
            {stops.map((s) => (
              <a key={s.id} href={`#${s.id}`} data-stop={s.id} className="relative z-[1] px-3.5 py-2.5 text-[12px] whitespace-nowrap text-white/70 transition-colors hover:text-white">
                {s.label}
              </a>
            ))}
          </div>
          <button onClick={() => setOpen(true)} className="rounded-[6px] bg-white/10 px-3.5 py-2.5 text-[12px] lg:hidden">
            Map
          </button>
        </nav>
      </div>
      <div className={`fixed inset-0 z-[70] flex flex-col bg-[#0c0f14] px-6 pb-10 pt-6 text-white transition-[opacity,visibility] duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}>
        <button onClick={() => setOpen(false)} className="self-end rounded-[6px] bg-white/10 px-3.5 py-2 text-[12px]">
          Close
        </button>
        <ul className="mt-auto flex flex-col gap-1">
          {stops.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)} className="flex items-center gap-4 border-b border-white/10 py-4">
                <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-display text-[26px]">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
