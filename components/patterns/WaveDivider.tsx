/**
 * Shaped edge between two sections of different colours (wavy, curved, tilted, torn).
 * Place it between sections: top colour = section above, bottom colour = section below.
 */
const shapes = {
  wave: "M0,64 C240,120 480,8 720,48 C960,88 1200,24 1440,56 L1440,120 L0,120 Z",
  curve: "M0,0 Q720,140 1440,0 L1440,120 L0,120 Z",
  arch: "M0,120 Q720,-40 1440,120 Z",
  tilt: "M0,0 L1440,90 L1440,120 L0,120 Z",
  torn: "M0,60 L60,40 L120,70 L200,35 L260,62 L340,30 L420,66 L500,38 L580,70 L660,34 L740,64 L820,30 L900,68 L980,36 L1060,64 L1140,32 L1220,70 L1300,40 L1380,66 L1440,44 L1440,120 L0,120 Z",
};

export default function WaveDivider({
  top,
  bottom,
  shape = "wave",
  height = 90,
  flip = false,
}: {
  top: string;
  bottom: string;
  shape?: keyof typeof shapes;
  height?: number;
  flip?: boolean;
}) {
  return (
    <div aria-hidden style={{ background: top, lineHeight: 0 }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height, display: "block", transform: flip ? "scaleX(-1)" : undefined }}>
        <path d={shapes[shape]} fill={bottom} />
      </svg>
    </div>
  );
}
