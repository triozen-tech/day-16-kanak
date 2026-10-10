"use client";

// Tiny shared "is the page ready?" tracker.
// Frame players register a task; the Loader waits for all tasks (or a timeout).

type Listener = (progress: number, done: boolean) => void;

const tasks = new Map<string, number>(); // id -> progress 0..1
const listeners = new Set<Listener>();
let finished = false;

function emit() {
  const values = [...tasks.values()];
  const progress = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
  const done = values.every((v) => v >= 1);
  listeners.forEach((l) => l(progress, done));
}

export const loading = {
  register(id: string) {
    if (!tasks.has(id)) tasks.set(id, 0);
    emit();
  },
  update(id: string, progress: number) {
    tasks.set(id, Math.min(1, progress));
    emit();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    emit();
    return () => listeners.delete(fn);
  },
  /** Called by the Loader when it has finished its exit animation. */
  markFinished() {
    finished = true;
    window.dispatchEvent(new Event("site:ready"));
  },
  get finished() {
    return finished;
  },
};

/** Run a callback once the loader is gone (immediately if it already is). */
export function onSiteReady(fn: () => void) {
  if (finished) {
    fn();
    return () => {};
  }
  const handler = () => fn();
  window.addEventListener("site:ready", handler, { once: true });
  return () => window.removeEventListener("site:ready", handler);
}
