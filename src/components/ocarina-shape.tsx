import { useId } from "react";

export function OcarinaShape() {
  const id = useId().replace(/:/g, "");
  return (
        <svg className="ocarina-shape" viewBox="0 0 420 300" role="img" aria-label="Blue Ocarina of Time">
          <defs>
            <linearGradient id={`${id}-crest-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="crest-stop-light" />
              <stop offset=".5" className="crest-stop-mid" />
              <stop offset="1" className="crest-stop-dark" />
            </linearGradient>
            <radialGradient id={`${id}-ocarina-body`} cx="36%" cy="28%" r="78%" gradientTransform="translate(0 .03) scale(1 .94)">
              <stop offset="0" className="ocarina-stop-light" />
              <stop offset="0.35" className="ocarina-stop-blue" />
              <stop offset="0.78" className="ocarina-stop-dark" />
              <stop offset="1" className="ocarina-stop-deep" />
            </radialGradient>
            <radialGradient id={`${id}-ocarina-glaze`} cx="35%" cy="29%" r="55%" gradientTransform="translate(0 .18) scale(1 .42)">
              <stop offset="0" className="ocarina-stop-glaze" />
              <stop offset="0.35" className="ocarina-stop-glaze" stopOpacity=".25" />
              <stop offset="1" className="ocarina-stop-clear" />
            </radialGradient>
            <filter id={`${id}-ocarina-soften`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="460" height="340"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id={`${id}-ceramic-mottle`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="4" seed="7" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.7  0 0 0 0 0.98  0 0 0 0.45 -0.08" />
            </filter>
            <filter id={`${id}-ceramic-speckle`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="3" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.92  0 0 0 0 1  1.6 1.6 1.6 -2.95 0" />
            </filter>
            <clipPath id={`${id}-ocarina-surface`}><use href={`#${id}-ocarina-outline`} /></clipPath>
            <linearGradient id={`${id}-ocarina-collar`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="ocarina-stop-silver-dark" />
              <stop offset="0.25" className="ocarina-stop-silver" />
              <stop offset="0.38" className="ocarina-stop-glint" />
              <stop offset="0.52" className="ocarina-stop-silver-dark" />
              <stop offset="0.7" className="ocarina-stop-silver" />
              <stop offset="1" className="ocarina-stop-silver-dark" />
            </linearGradient>
          </defs>
          <path id={`${id}-ocarina-outline`} className="ocarina-body" fill={`url(#${id}-ocarina-body)`} d="M 99 129 C 105 119 108 107 110 96 L 112 69 Q 112 61 120 58 L 137 54 Q 143 53 146 60 L 161 100 Q 166 117 175 126 C 248 126 332 145 385 171 C 413 184 414 197 394 209 C 345 238 255 260 166 268 C 103 273 53 259 31 234 C 7 207 26 170 62 149 C 76 140 87 133 99 129 Z" />
          <g clipPath={`url(#${id}-ocarina-surface)`}>
            <use href={`#${id}-ocarina-outline`} className="ocarina-glaze" fill={`url(#${id}-ocarina-glaze)`} />
            <rect className="ocarina-mottle" x="0" y="0" width="420" height="300" filter={`url(#${id}-ceramic-mottle)`} />
            <rect className="ocarina-speckle" x="0" y="0" width="420" height="300" filter={`url(#${id}-ceramic-speckle)`} />
            <path className="ocarina-contour" filter={`url(#${id}-ocarina-soften)`} d="M 30 228 C 72 283 225 283 393 208" />
            <path className="ocarina-reflection" filter={`url(#${id}-ocarina-soften)`} d="M 46 241 C 108 279 253 248 369 222" />
            <path className="ocarina-highlight" filter={`url(#${id}-ocarina-soften)`} d="M 44 174 C 61 155 77 148 93 144 M 121 67 Q 118 78 118 94" />
            <path className="ocarina-reflection" filter={`url(#${id}-ocarina-soften)`} d="M 229 137 Q 315 150 386 183" />
          </g>
          <g transform="translate(-45 0)">
          <path className="ocarina-collar" fill={`url(#${id}-ocarina-collar)`} d="M 154 100 Q 180 104 206 100 C 211 117 215 122 220 126 Q 220 127 218 128 Q 181 142 146 130 Q 144 130 144 129 C 150 119 153 107 154 100 Z" />
          <path className="ocarina-metal-detail" d="M 154 104 Q 180 109 207 104 M 147 127 Q 181 139 214 127" />
          <svg className="ocarina-triforce" fill={`url(#${id}-crest-gold)`} x="163.7" y="106.2" width="34.6" height="24.2" viewBox="0 0 22 19" aria-hidden="true">
            <path d="M11 0 16.5 9.5H5.5Z M5.5 9.5 11 19H0Z M16.5 9.5 22 19H11Z" />
          </svg>
          </g>
        </svg>
  );
}
