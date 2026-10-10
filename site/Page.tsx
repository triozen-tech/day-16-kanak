// Kanak Jewels · the page (site/DESIGN.md: Layout A "The Halo" + C's Collections and Product detail).
// Round 1: structure only, every section in its final state. Loader (I31), pins, the dial turn and all motion
// arrive in Rounds 2–4.
import CoinLoader from "./components/CoinLoader";
import HaloHero from "./components/HaloHero";
import CollectionSwitch from "./components/CollectionSwitch";
import HourClock from "./components/HourClock";
import PieceDetail from "./components/PieceDetail";
import Hallmark from "./components/Hallmark";
import Craft from "./components/Craft";
import FestiveFan from "./components/FestiveFan";
import Reviews from "./components/Reviews";
import KanakFooter from "./components/KanakFooter";
import BagPill from "./components/BagPill";
import Predecode from "./components/Predecode";

export default function Page() {
  return (
    <main className="relative bg-[var(--ivory)] text-[var(--ink)]">
      <CoinLoader />
      <BagPill />
      <Predecode />
      <HaloHero />
      <CollectionSwitch />
      <HourClock />
      <PieceDetail />
      <Hallmark />
      <Craft />
      <FestiveFan />
      <Reviews />
      <KanakFooter />
      {/* record: the very end of the page (lesson 66: the stop sits after the footer, not on it) */}
      <div className="h-px" data-record-time="1.0" data-record-hold="1.6" data-record-align="bottom" data-record-label="Footer" />
    </main>
  );
}
