import { useId } from "react";
export default function SolarLogo({
  name,
  variant = "full",
  className = "",
}: {
  name: string;
  variant?: "full" | "mark" | "white";
  className?: string;
}) {
  const id = useId(),
    mark = variant === "mark",
    white = variant === "white",
    width = mark ? 64 : 76 + name.length * 13;
  const primary = white ? "var(--solar-white)" : "var(--solar-logo)",
    accent = white ? "var(--solar-white)" : "var(--solar-accent)";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} 64`}
      role="img"
      aria-labelledby={id}
      className={className}
    >
      <title id={id}>{`${name} — mặt trời và lá`}</title>
      <g strokeLinecap="round" strokeLinejoin="round">
        <circle cx="26" cy="25" r="13" fill={accent} />
        <path
          d="M26 5V1 M26 49V45 M6 25H2 M50 25H54 M12 11L9 8 M40 11L43 8 M12 39L9 42"
          stroke={primary}
          strokeWidth="3"
        />
        <path d="M25 54C25 38 39 30 58 32C57 50 42 61 25 54Z" fill={primary} />
        <path
          d="M29 51L48 39"
          stroke={
            white ? "var(--solar-primary-dark)" : "var(--solar-background)"
          }
          strokeWidth="2.5"
        />
      </g>
      {!mark && (
        <text
          x="72"
          y="39"
          fontFamily="var(--font-body),Arial,sans-serif"
          fontSize="24"
          fontWeight="700"
          fill={white ? "var(--solar-white)" : "var(--solar-text)"}
        >
          {name}
        </text>
      )}
    </svg>
  );
}
