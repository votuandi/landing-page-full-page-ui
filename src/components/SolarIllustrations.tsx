import type { CSSProperties, ReactNode } from "react";

// Decorative flat illustrations in the template-7 palette. Entrance animations
// start when the wrapping [data-reveal] element receives `.is-visible`.
const C = {
  blue: "#155bd7",
  ink: "#183758",
  sky: "#edf6ff",
  sky2: "#d2e7fc",
  sun: "#f3c75c",
  sunSoft: "#fff0c1",
  green: "#3b8d77",
  greenSoft: "#e8f4ef",
  panel: "#1f56a8",
  panelLine: "#7aa5e8",
  line: "#cfdeee",
  lineSoft: "#e4edf6",
  stroke: "#d5e4ee",
};

const order = (i: number) => ({ "--i": i }) as CSSProperties;
const round = (n: number) => Math.round(n * 10) / 10;

function Svg({
  viewBox,
  className = "",
  children,
}: {
  viewBox: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={`solar-ill ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return [
      round(cx + Math.cos(a) * (r + 10)),
      round(cy + Math.sin(a) * (r + 10)),
      round(cx + Math.cos(a) * (r + 20)),
      round(cy + Math.sin(a) * (r + 20)),
    ];
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 28} fill={C.sunSoft} opacity=".75" />
      <g className="ill-sun-rays">
        {rays.map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.sun}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={C.sun} />
    </g>
  );
}

// A trapezoid of solar cells; top and bottom edges may differ for perspective.
function PanelArea({
  tl,
  tr,
  bl,
  br,
  y1,
  y2,
  cols,
  rows,
}: {
  tl: number;
  tr: number;
  bl: number;
  br: number;
  y1: number;
  y2: number;
  cols: number;
  rows: number;
}) {
  const lines: string[] = [];
  for (let r = 1; r < rows; r++) {
    const t = r / rows;
    const y = round(y1 + (y2 - y1) * t);
    lines.push(
      `M${round(tl + (bl - tl) * t)} ${y}H${round(tr + (br - tr) * t)}`,
    );
  }
  for (let c = 1; c < cols; c++) {
    const t = c / cols;
    lines.push(
      `M${round(tl + (tr - tl) * t)} ${y1}L${round(bl + (br - bl) * t)} ${y2}`,
    );
  }
  return (
    <g>
      <polygon
        points={`${tl},${y1} ${tr},${y1} ${br},${y2} ${bl},${y2}`}
        fill={C.panel}
      />
      <path d={lines.join("")} stroke={C.panelLine} strokeWidth="1.5" />
      <polygon
        className="ill-shine"
        points={`${tl},${y1} ${round(tl + (tr - tl) * 0.3)},${y1} ${round(bl + (br - bl) * 0.12)},${y2} ${bl},${y2}`}
        fill="#fff"
        opacity=".12"
      />
    </g>
  );
}

function Cloud({ x, y, s = 1, i = 0 }: { x: number; y: number; s?: number; i?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="ill-drift" style={order(i)}>
        <ellipse rx="36" ry="13" fill="#fff" />
        <circle cx="-11" cy="-8" r="14" fill="#fff" />
        <circle cx="12" cy="-11" r="18" fill="#fff" />
      </g>
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-26" width="6" height="26" rx="2" fill="#b58b5d" />
      <circle cy="-40" r="20" fill="#a7d7bb" />
      <circle cx="9" cy="-32" r="13" fill="#86c3a0" />
    </g>
  );
}

function BoltChip({ x, y, i = 0 }: { x: number; y: number; i?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ill-pop" style={order(i + 3)}>
        <g className="ill-float" style={order(i)}>
          <circle r="15" fill="#fff" stroke={C.sky2} strokeWidth="2" />
          <path
            d="M2 -8 L-5 1 H0 L-2 8 L5 -1 H0 Z"
            fill={C.sun}
            stroke="#a76b00"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </g>
  );
}

function Check({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={C.greenSoft} />
      <path
        className="ill-draw"
        style={order(i)}
        pathLength={1}
        d={`M${x - 5} ${y}l4 4.5l7.5 -8.5`}
        fill="none"
        stroke={C.green}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function TextLines({ x, y, widths, gap = 16 }: { x: number; y: number; widths: number[]; gap?: number }) {
  return (
    <g>
      {widths.map((w, k) => (
        <rect
          key={k}
          x={x}
          y={y + k * gap}
          width={w}
          height={k ? 7 : 8}
          rx="3.5"
          fill={k ? C.lineSoft : C.line}
        />
      ))}
    </g>
  );
}

function star(cx: number, cy: number, R: number, r: number) {
  return Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const d = k % 2 ? r : R;
    return `${round(cx + Math.cos(a) * d)},${round(cy + Math.sin(a) * d)}`;
  }).join(" ");
}

/** Factory, shop and home sharing one sun — sits above the solution cards. */
export function SolarSceneIllustration() {
  return (
    <Svg viewBox="0 0 1200 380" className="solar-ill-scene">
      <defs>
        <linearGradient id="ill-scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4f1ff" />
          <stop offset="1" stopColor="#f9f6ef" />
        </linearGradient>
      </defs>
      <rect width="1200" height="380" rx="32" fill="url(#ill-scene-sky)" />
      <Cloud x={230} y={88} i={0} />
      <Cloud x={960} y={72} s={1.2} i={1} />
      <Cloud x={410} y={52} s={0.7} i={2} />
      <Cloud x={790} y={150} s={0.6} i={3} />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={600} cy={94} r={34} />
      </g>
      <g fill="none" stroke={C.sun} strokeWidth="3" strokeLinecap="round">
        <path className="ill-flow" d="M562 112 Q 390 108 215 182" />
        <path className="ill-flow" d="M600 150 V 196" />
        <path className="ill-flow" d="M638 112 Q 810 108 1005 170" />
      </g>
      <path
        d="M0 318 H1200 V348 a32 32 0 0 1 -32 32 H32 a32 32 0 0 1 -32 -32 Z"
        fill="#e3f0e8"
      />
      <path
        d="M48 350 H1152"
        stroke="#cfe3d6"
        strokeWidth="3"
        strokeDasharray="18 14"
        strokeLinecap="round"
      />
      <Tree x={36} y={318} s={0.8} />
      <Tree x={440} y={318} />
      <Tree x={782} y={318} s={0.9} />
      <Tree x={1160} y={318} s={0.85} />

      {/* Factory */}
      <g className="ill-rise" style={order(1)}>
        <rect x="292" y="150" width="20" height="72" rx="3" fill="#b9ccdf" />
        <rect x="288" y="146" width="28" height="8" rx="3" fill="#9fb4ca" />
        <polygon points="72,222 338,222 322,194 88,194" fill="#cfe0f2" />
        <PanelArea tl={96} tr={314} bl={84} br={326} y1={197} y2={219} cols={8} rows={2} />
        <rect x="64" y="222" width="282" height="96" fill="#fff" />
        <rect x="64" y="222" width="282" height="8" fill={C.ink} opacity=".12" />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={84 + k * 52} y="242" width="38" height="24" rx="3" fill={C.sky2} />
        ))}
        <rect x="170" y="280" width="70" height="38" rx="3" fill={C.ink} />
        <path d="M170 292 H240 M170 304 H240" stroke="#fff" strokeOpacity=".25" strokeWidth="2" />
      </g>

      {/* Shop */}
      <g className="ill-rise" style={order(2)}>
        <polygon points="494,238 706,238 690,210 510,210" fill="#cfe0f2" />
        <PanelArea tl={518} tr={682} bl={506} br={694} y1={213} y2={235} cols={6} rows={2} />
        <rect x="500" y="238" width="200" height="80" fill="#fff" />
        {Array.from({ length: 8 }, (_, k) => (
          <g key={k} fill={k % 2 ? "#fff" : C.sun}>
            <rect x={492 + k * 27} y="246" width="27" height="18" />
            <path d={`M${492 + k * 27} 264 a13.5 13.5 0 0 0 27 0 Z`} />
          </g>
        ))}
        <rect x="492" y="244" width="216" height="4" rx="2" fill="#d9a93a" />
        <rect x="516" y="282" width="84" height="36" rx="3" fill={C.sky2} />
        <rect x="616" y="282" width="44" height="36" rx="3" fill={C.ink} />
      </g>

      {/* Home + battery */}
      <g className="ill-rise" style={order(3)}>
        <polygon points="906,246 1094,246 1074,184 926,184" fill={C.ink} />
        <PanelArea tl={940} tr={1060} bl={926} br={1074} y1={192} y2={238} cols={4} rows={2} />
        <rect x="920" y="246" width="160" height="72" fill="#fff" />
        <rect x="936" y="262" width="34" height="26" rx="3" fill={C.sky2} />
        <rect x="1030" y="262" width="34" height="26" rx="3" fill={C.sky2} />
        <rect x="985" y="276" width="30" height="42" rx="3" fill={C.ink} />
        <rect x="1092" y="276" width="26" height="42" rx="5" fill={C.greenSoft} stroke={C.green} strokeWidth="2" />
        <rect x="1099" y="270" width="12" height="6" rx="2" fill={C.green} />
        <rect className="ill-charge" x="1097" y="294" width="16" height="19" rx="2" fill={C.green} />
      </g>

      <BoltChip x={215} y={180} i={0} />
      <BoltChip x={600} y={194} i={1} />
      <BoltChip x={1005} y={168} i={2} />
    </Svg>
  );
}

/** Clipboard, panel and gear — the end-to-end service journey. */
export function JourneyIllustration() {
  return (
    <Svg viewBox="0 0 480 350">
      <circle cx="250" cy="180" r="150" fill={C.sky} />
      <ellipse cx="250" cy="322" rx="200" ry="13" fill="#dce9f6" />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={432} cy={52} r={16} />
      </g>

      <g className="ill-rise" style={order(0)}>
        <rect x="56" y="92" width="150" height="214" rx="16" fill="#fff" stroke={C.stroke} strokeWidth="2" />
        <rect x="100" y="80" width="62" height="24" rx="9" fill={C.ink} />
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <Check x={86} y={142 + k * 40} i={k + 2} />
            <TextLines x={106} y={134 + k * 40} widths={k % 2 ? [64, 44] : [80, 56]} gap={12} />
          </g>
        ))}
      </g>

      <g className="ill-rise" style={order(1)}>
        <path d="M330 222 V 314 M298 314 H 362" stroke="#9fb4ca" strokeWidth="8" strokeLinecap="round" />
        <g transform="translate(236 128) rotate(-9)">
          <rect x="-6" y="-6" width="200" height="112" rx="10" fill={C.ink} />
          <PanelArea tl={0} tr={188} bl={0} br={188} y1={0} y2={100} cols={6} rows={3} />
        </g>
      </g>

      <g transform="translate(222 72)">
        <g className="ill-spin">
          <circle r="22" fill="none" stroke={C.sun} strokeWidth="10" strokeDasharray="6.9 6.92" />
          <circle r="17" fill={C.sun} />
          <circle r="7" fill="#fff" />
        </g>
      </g>

      <g transform="translate(352 240)">
        <g className="ill-float" style={order(1)}>
          <rect width="116" height="74" rx="12" fill="#fff" stroke={C.stroke} strokeWidth="2" />
          {[18, 28, 22, 40].map((h, k) => (
            <rect
              key={k}
              className="ill-grow"
              style={order(k + 3)}
              x={16 + k * 22}
              y={62 - h}
              width="14"
              height={h}
              rx="3"
              fill={k === 3 ? C.sun : C.sky2}
            />
          ))}
          <circle className="ill-blink" cx="100" cy="16" r="5" fill={C.green} />
        </g>
      </g>
    </Svg>
  );
}

/** Coin stacks growing along a trend line. */
export function InvestmentIllustration() {
  const heights = [54, 88, 124, 168];
  return (
    <Svg viewBox="0 0 480 330">
      <circle cx="240" cy="170" r="148" fill="#fff" opacity=".85" />
      <ellipse cx="240" cy="300" rx="205" ry="12" fill="#ece3d1" />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={410} cy={66} r={20} />
      </g>
      {heights.map((h, k) => {
        const x = 84 + k * 68;
        const y = 298 - h;
        return (
          <g key={k} className="ill-grow" style={order(k)}>
            <rect x={x} y={y} width="46" height={h} rx="10" fill={k === 3 ? C.blue : "#8fb6ee"} />
            <path
              d={Array.from({ length: Math.floor(h / 22) }, (_, n) => `M${x + 8} ${y + 22 + n * 22}H${x + 38}`).join("")}
              stroke="#fff"
              strokeOpacity=".3"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <ellipse cx={x + 23} cy={y} rx="23" ry="8" fill={C.sun} />
          </g>
        );
      })}
      <path
        className="ill-draw"
        style={order(4)}
        pathLength={1}
        d="M92 218 L170 182 L238 146 L322 92 M300 90 L322 92 L318 114"
        fill="none"
        stroke={C.sun}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(410 196)">
        <g className="ill-float" style={order(1)}>
          <circle r="22" fill={C.sun} stroke="#d9a93a" strokeWidth="3" />
          <text y="8" textAnchor="middle" fontSize="22" fontWeight="800" fill="#8c681e">
            đ
          </text>
        </g>
      </g>
      <g className="ill-rise" style={order(3)}>
        <path d="M376 296 V 282 M440 296 V 276" stroke="#9fb4ca" strokeWidth="5" strokeLinecap="round" />
        <PanelArea tl={372} tr={446} bl={358} br={452} y1={246} y2={284} cols={4} rows={2} />
      </g>
    </Svg>
  );
}

function Badge({
  x,
  y,
  i,
  children,
}: {
  x: number;
  y: number;
  i: number;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ill-pop" style={order(i)}>
        <g className="ill-float" style={order(i)}>
          <rect width="116" height="54" rx="15" fill="#fff" stroke={C.stroke} strokeWidth="2" />
          {children}
          <TextLines x={50} y={17} widths={[50, 34]} gap={14} />
        </g>
      </g>
    </g>
  );
}

/** Shield with component badges orbiting — separated warranties. */
export function WarrantyIllustration() {
  return (
    <Svg viewBox="0 0 480 320">
      <circle cx="240" cy="160" r="128" fill={C.sky} />
      <circle
        className="ill-spin-slow"
        cx="240"
        cy="160"
        r="150"
        fill="none"
        stroke="#c5d9ee"
        strokeWidth="2"
        strokeDasharray="4 10"
      />
      <g className="ill-pop" style={order(0)}>
        <path d="M240 46 L326 78 V150 C326 208 288 246 240 266 C192 246 154 208 154 150 V78 Z" fill={C.blue} />
        <path d="M240 68 L306 93 V150 C306 196 276 226 240 243 C204 226 174 196 174 150 V93 Z" fill="#2f74e6" />
        <path
          className="ill-draw"
          style={order(3)}
          pathLength={1}
          d="M206 154 L232 180 L278 128"
          fill="none"
          stroke="#fff"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Badge x={10} y={76} i={1}>
        <g transform="translate(12 12)">
          <rect x="-2" y="-2" width="32" height="34" rx="5" fill={C.ink} />
          <PanelArea tl={0} tr={28} bl={0} br={28} y1={0} y2={30} cols={2} rows={3} />
        </g>
      </Badge>
      <Badge x={354} y={58} i={2}>
        <rect x="13" y="10" width="26" height="34" rx="6" fill="#fff" stroke={C.ink} strokeWidth="2.5" />
        <rect x="18" y="16" width="16" height="9" rx="2" fill={C.ink} />
        <circle className="ill-blink" cx="21" cy="34" r="2.6" fill={C.green} />
        <circle cx="30" cy="34" r="2.6" fill={C.sky2} />
      </Badge>
      <Badge x={342} y={206} i={3}>
        <rect x="21" y="7" width="10" height="5" rx="2" fill={C.green} />
        <rect x="14" y="11" width="24" height="34" rx="5" fill={C.greenSoft} stroke={C.green} strokeWidth="2.5" />
        <rect className="ill-charge" x="18" y="26" width="16" height="15" rx="2" fill={C.green} />
      </Badge>
    </Svg>
  );
}

/** Document with roof sketch, magnifier and approval stamp. */
export function PolicyIllustration() {
  return (
    <Svg viewBox="0 0 480 320">
      <circle cx="240" cy="165" r="135" fill="#f5e8cb" opacity=".75" />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={384} cy={66} r={18} />
      </g>
      <g className="ill-rise" style={order(0)}>
        <rect x="148" y="36" width="184" height="248" rx="16" fill="#fff" stroke="#eadcbc" strokeWidth="2" />
        <polygon points="190,112 290,112 278,76 202,76" fill={C.ink} />
        <PanelArea tl={210} tr={270} bl={200} br={280} y1={82} y2={106} cols={3} rows={1} />
        <rect x="198" y="112" width="84" height="24" fill="#f2f6fb" />
        <rect x="232" y="118" width="16" height="18" rx="2" fill={C.sky2} />
        {[136, 112, 136, 96, 120].map((w, k) => (
          <rect key={k} x="172" y={160 + k * 20} width={w} height="8" rx="4" fill={k ? "#efe6d3" : "#dccca6"} />
        ))}
      </g>
      <g transform="translate(116 196)">
        <g className="ill-float" style={order(1)}>
          <circle r="30" fill="#ffffffb3" stroke={C.ink} strokeWidth="8" />
          <path d="M22 22 L46 46" stroke={C.ink} strokeWidth="11" strokeLinecap="round" />
          <path d="M-15 -4 a16 16 0 0 1 11 -11" stroke={C.blue} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(320 240)">
        <g className="ill-stamp" style={order(4)}>
          <circle r="36" fill="#fff" stroke={C.green} strokeWidth="3" />
          <circle r="28" fill="none" stroke={C.green} strokeWidth="2" strokeDasharray="3 4" />
          <path d="M-12 0 L-3 9 L13 -9" stroke={C.green} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </Svg>
  );
}

/** Review bubbles — customer feedback. */
export function FeedbackIllustration() {
  return (
    <Svg viewBox="0 0 480 290">
      <circle cx="250" cy="150" r="130" fill={C.sky} />
      <g className="ill-pop" style={order(0)}>
        <g className="ill-float" style={order(0)}>
          <path d="M112 166 L100 204 L146 166 Z" fill="#fff" stroke={C.stroke} strokeWidth="2" strokeLinejoin="round" />
          <rect x="60" y="48" width="236" height="120" rx="24" fill="#fff" stroke={C.stroke} strokeWidth="2" />
          <rect x="110" y="160" width="40" height="8" fill="#fff" />
          {[0, 1, 2, 3, 4].map((k) => (
            <polygon key={k} className="ill-pop" style={order(k + 2)} points={star(96 + k * 30, 86, 11, 5)} fill={C.sun} />
          ))}
          <TextLines x={84} y={116} widths={[184, 132]} gap={20} />
        </g>
      </g>
      <g className="ill-pop" style={order(2)}>
        <g className="ill-float" style={order(2)}>
          <path d="M392 228 L412 262 L360 228 Z" fill={C.blue} />
          <rect x="246" y="138" width="190" height="94" rx="24" fill={C.blue} />
          <circle cx="286" cy="185" r="19" fill={C.sun} />
          <path d="M278 185 l6 6 l10 -12" stroke={C.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="318" y="170" width="92" height="9" rx="4.5" fill="#fff" opacity=".9" />
          <rect x="318" y="190" width="62" height="8" rx="4" fill="#fff" opacity=".5" />
        </g>
      </g>
      <circle className="ill-blink" cx="56" cy="236" r="7" fill={C.sun} />
      <circle cx="440" cy="76" r="5" fill={C.sky2} />
      <circle cx="456" cy="104" r="3.5" fill={C.sun} />
    </Svg>
  );
}

/** Panel, inverter and battery linked by energy flow. */
export function EquipmentIllustration() {
  return (
    <Svg viewBox="0 0 520 310">
      <circle cx="270" cy="150" r="140" fill={C.sky} opacity=".9" />
      <ellipse cx="260" cy="280" rx="230" ry="18" fill="#dce9f6" />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={62} cy={58} r={20} />
      </g>

      <g className="ill-rise" style={order(0)}>
        <path d="M114 196 V 270 M88 270 H140" stroke="#9fb4ca" strokeWidth="7" strokeLinecap="round" />
        <g transform="translate(40 122) rotate(-12)">
          <rect x="-5" y="-5" width="150" height="96" rx="8" fill={C.ink} />
          <PanelArea tl={0} tr={140} bl={0} br={140} y1={0} y2={86} cols={5} rows={3} />
        </g>
      </g>

      <g className="ill-rise" style={order(1)}>
        <rect x="218" y="122" width="96" height="128" rx="14" fill="#fff" stroke="#cbdcee" strokeWidth="2" />
        <rect x="234" y="140" width="64" height="38" rx="6" fill={C.ink} />
        <path className="ill-flow" d="M240 160 q8 -14 16 0 t16 0 t16 0" stroke={C.sun} strokeWidth="2.5" fill="none" />
        <circle className="ill-blink" cx="244" cy="198" r="4" fill={C.green} />
        <circle cx="258" cy="198" r="4" fill={C.sky2} />
        <rect x="236" y="216" width="60" height="4" rx="2" fill={C.lineSoft} />
        <rect x="236" y="226" width="60" height="4" rx="2" fill={C.lineSoft} />
        <path d="M232 250 V 266 M300 250 V 266" stroke="#9fb4ca" strokeWidth="6" strokeLinecap="round" />
      </g>

      <g className="ill-rise" style={order(2)}>
        <rect x="392" y="86" width="32" height="14" rx="4" fill={C.ink} />
        <rect x="362" y="96" width="92" height="172" rx="16" fill="#fff" stroke="#cbdcee" strokeWidth="2" />
        {[0, 1, 2, 3].map((k) => (
          <rect
            key={k}
            className={k === 3 ? "ill-charge" : undefined}
            x="378"
            y={228 - k * 34}
            width="60"
            height="26"
            rx="6"
            fill={k === 3 ? C.greenSoft : C.green}
            style={k === 3 ? undefined : { opacity: 1 - k * 0.15 }}
          />
        ))}
      </g>

      <g fill="none" stroke={C.sun} strokeWidth="4" strokeLinecap="round">
        <path className="ill-flow" d="M194 190 H 218" />
        <path className="ill-flow" d="M314 186 H 362" />
      </g>
      <BoltChip x={338} y={160} i={1} />
    </Svg>
  );
}

/** Question and answer bubbles with an idea bulb. */
export function QuestionIllustration() {
  return (
    <Svg viewBox="0 0 420 290">
      <circle cx="210" cy="150" r="128" fill={C.sky} />
      <g className="ill-pop" style={order(0)}>
        <g className="ill-float" style={order(0)}>
          <path d="M128 176 L112 218 L170 178 Z" fill={C.blue} />
          <rect x="88" y="48" width="164" height="132" rx="32" fill={C.blue} />
          <text x="170" y="146" textAnchor="middle" fontSize="92" fontWeight="800" fill="#fff">
            ?
          </text>
        </g>
      </g>
      <g className="ill-pop" style={order(2)}>
        <g className="ill-float" style={order(2)}>
          <path d="M346 224 L362 254 L322 224 Z" fill="#fff" stroke={C.stroke} strokeWidth="2" strokeLinejoin="round" />
          <rect x="234" y="148" width="146" height="78" rx="22" fill="#fff" stroke={C.stroke} strokeWidth="2" />
          <rect x="324" y="218" width="30" height="8" fill="#fff" />
          <Check x={266} y={187} i={4} />
          <TextLines x={288} y={176} widths={[70, 48]} gap={16} />
        </g>
      </g>
      <g transform="translate(330 64)">
        <g className="ill-float" style={order(1)}>
          <g className="ill-blink">
            {[-70, -35, 0, 35, 70].map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={round(Math.cos(a) * 32)}
                  y1={round(Math.sin(a) * 32)}
                  x2={round(Math.cos(a) * 43)}
                  y2={round(Math.sin(a) * 43)}
                  stroke={C.sun}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          <circle r="24" fill={C.sun} />
          <path d="M-8 4 q4 -12 8 0 q4 12 8 0" stroke="#a76b00" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-10" y="21" width="20" height="14" rx="3" fill={C.ink} />
        </g>
      </g>
      <circle cx="60" cy="230" r="6" fill={C.sun} />
      <circle cx="44" cy="90" r="4" fill={C.sky2} />
    </Svg>
  );
}

/** Solar home sending a message to the advisor. */
export function ContactIllustration() {
  return (
    <Svg viewBox="0 0 460 270">
      <ellipse cx="230" cy="150" rx="215" ry="118" fill="#fff" opacity=".6" />
      <ellipse cx="150" cy="252" rx="150" ry="12" fill="#eadfc9" />
      <g className="ill-pop" style={order(0)}>
        <Sun cx={46} cy={46} r={15} />
      </g>
      <g className="ill-rise" style={order(0)}>
        <polygon points="40,170 240,170 218,104 62,104" fill={C.ink} />
        <PanelArea tl={78} tr={202} bl={62} br={218} y1={112} y2={162} cols={4} rows={2} />
        <rect x="54" y="170" width="172" height="80" fill="#fff" />
        <rect x="72" y="186" width="36" height="28" rx="3" fill={C.sky2} />
        <rect x="172" y="186" width="36" height="28" rx="3" fill={C.sky2} />
        <rect x="124" y="204" width="32" height="46" rx="3" fill={C.ink} />
      </g>
      <path
        className="ill-flow"
        d="M214 98 C 262 34 300 132 372 70"
        fill="none"
        stroke={C.blue}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g transform="translate(396 56)">
        <g className="ill-float" style={order(1)}>
          <path d="M-30 6 L34 -22 L10 28 L2 10 Z" fill="#fff" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M2 10 L34 -22" stroke={C.ink} strokeWidth="2" />
        </g>
      </g>
      <g className="ill-pop" style={order(3)}>
        <rect x="292" y="160" width="132" height="66" rx="18" fill="#fff" stroke={C.stroke} strokeWidth="2" />
        <circle cx="324" cy="193" r="16" fill={C.sun} />
        <path
          d="M318 186 c0 8 5 13 13 13 l2 -4 -4 -2 -2 2 c-3 -1 -5 -3 -6 -6 l2 -2 -2 -4 z"
          fill={C.ink}
        />
        <TextLines x={350} y={182} widths={[56, 38]} gap={15} />
      </g>
    </Svg>
  );
}
