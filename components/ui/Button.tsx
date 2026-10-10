import Magnetic from "./Magnetic";

export default function Button({
  href,
  label,
  style = "solid",
}: {
  href: string;
  label: string;
  style?: "solid" | "outline";
}) {
  return (
    <Magnetic>
      <a href={href} className={`btn ${style === "solid" ? "btn-solid" : "btn-outline"}`}>
        {label}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
          <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </a>
    </Magnetic>
  );
}
