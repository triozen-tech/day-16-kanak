/** Placeholder page: the kit is ready, today's site is not built yet. Run /new-site (Round 0 → site/DESIGN.md). */
export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Showreel Kit</p>
        <h1 className="font-display mt-4 text-[clamp(40px,6vw,88px)] leading-none">Today&apos;s site starts here.</h1>
        <p className="mt-6 text-muted">
          Run <code>/new-site</code> · effects at <a className="underline" href="/lab">/lab</a> · layouts at{" "}
          <a className="underline" href="/lab/sections">/lab/sections</a> · patterns at{" "}
          <a className="underline" href="/patterns">/patterns</a>
        </p>
      </div>
    </main>
  );
}
