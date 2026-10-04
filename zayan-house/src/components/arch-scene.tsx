/**
 * Decorative brand illustration (pure SVG, no photos needed): a deep-green arch with the Zayan mark,
 * a marble podium, folded cloth, a shopping bag, gold spheres and leaves.
 * variant "hero" is the large scene; "compact" is a tighter crop used inside the offer banner.
 */
export function ArchScene({ variant = "hero", className = "" }: { variant?: "hero" | "compact"; className?: string }) {
  const compact = variant === "compact";
  return (
    <svg
      viewBox={compact ? "180 120 460 330" : "0 0 760 480"}
      preserveAspectRatio={compact ? "xMidYMax meet" : "xMaxYMid slice"}
      role="img"
      aria-label="Zayan House brand illustration"
      className={className}
    >
      <defs>
        <linearGradient id={`g-arch-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17584d" /><stop offset="1" stopColor="#0a2f28" />
        </linearGradient>
        <linearGradient id={`g-gold-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0dca8" /><stop offset="1" stopColor="#b88f43" />
        </linearGradient>
        <linearGradient id={`g-marble-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf7" /><stop offset="1" stopColor="#e9dcc2" />
        </linearGradient>
        <linearGradient id={`g-cloth-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c6154" /><stop offset="1" stopColor="#0c3a32" />
        </linearGradient>
        <radialGradient id={`g-sphere-${variant}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff4cf" /><stop offset="0.45" stopColor="#d9b868" /><stop offset="1" stopColor="#8f6c2c" />
        </radialGradient>
        <radialGradient id={`g-glow-${variant}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.9" /><stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!compact && (
        <>
          <ellipse cx="560" cy="200" rx="330" ry="260" fill={`url(#g-glow-${variant})`} />
          {/* soft background arches */}
          <path d="M520 480 V230 a120 120 0 0 1 240 0 V480 Z" fill="#fffaf0" opacity="0.7" />
          <path d="M560 480 V250 a90 90 0 0 1 180 0 V480 Z" fill="none" stroke="#e5d6b4" strokeWidth="2" opacity="0.8" />
          {/* palm leaves, top right */}
          <g fill="#7c8a45" opacity="0.9">
            <path d="M760 40 C700 40 650 80 620 150 C690 120 735 95 760 40 Z" />
            <path d="M760 60 C720 90 700 140 700 200 C740 160 758 120 760 60 Z" opacity="0.8" />
            <path d="M760 20 C710 10 665 25 630 60 C690 60 735 50 760 20 Z" fill="#9aa45a" />
          </g>
          {/* tall vase with dried stems, left */}
          <g>
            <path d="M120 400 C100 360 105 320 128 305 L150 305 C172 320 178 360 158 400 Z" fill={`url(#g-marble-${variant})`} stroke="#d9c9a5" />
            <g stroke="#b88f43" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M139 305 C132 250 120 210 118 150" /><path d="M139 305 C142 240 150 190 160 120" />
              <path d="M139 305 C150 260 178 220 196 190" />
            </g>
            <g fill="#d9b868">
              {[[118, 150], [160, 120], [196, 190], [124, 190], [152, 170], [176, 215]].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx="5" ry="9" transform={`rotate(${i * 25 - 40} ${x} ${y})`} />
              ))}
            </g>
          </g>
        </>
      )}

      {/* main arch */}
      <path d="M250 405 V195 a130 130 0 0 1 260 0 V405 Z" fill={`url(#g-arch-${variant})`} />
      <path d="M262 405 V198 a118 118 0 0 1 236 0 V405" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="2.5" />
      <path d="M250 405 V195 a130 130 0 0 1 260 0 V405" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="4" />
      {/* medallion with the brand mark */}
      <circle cx="380" cy="205" r="62" fill="#fcfaf5" />
      <circle cx="380" cy="205" r="62" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="3" />
      <circle cx="380" cy="205" r="53" fill="none" stroke="#e6d3a3" strokeWidth="1" />
      <image href="/logo-mark.png" x="352" y="172" width="56" height="64" preserveAspectRatio="xMidYMid meet" />

      {/* podium */}
      <ellipse cx="380" cy="432" rx="270" ry="30" fill={`url(#g-marble-${variant})`} />
      <ellipse cx="380" cy="426" rx="270" ry="30" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="2" />
      <ellipse cx="380" cy="408" rx="215" ry="22" fill="#0c3a32" />
      <ellipse cx="380" cy="404" rx="215" ry="22" fill={`url(#g-marble-${variant})`} />
      <ellipse cx="380" cy="404" rx="215" ry="22" fill="none" stroke="#e5d6b4" />

      {/* folded cloth stack, left of podium */}
      <g>
        <rect x="210" y="368" width="150" height="34" rx="10" fill="#fff9ec" stroke="#e5d6b4" />
        <rect x="222" y="338" width="140" height="34" rx="10" fill={`url(#g-cloth-${variant})`} />
        <g fill={`url(#g-gold-${variant})`} opacity="0.9">
          {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={240 + i * 14} cy="355" r="2.6" />)}
        </g>
        <rect x="230" y="312" width="120" height="30" rx="10" fill="#fffdf7" stroke="#e5d6b4" />
        <rect x="318" y="322" width="26" height="14" rx="3" fill="#0f3d35" transform="rotate(-8 331 329)" />
      </g>

      {/* shopping bag, right of podium */}
      <g>
        <rect x="408" y="262" width="118" height="142" rx="9" fill="#0c3a32" />
        <rect x="408" y="262" width="118" height="142" rx="9" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="1.5" opacity="0.8" />
        <path d="M436 262 C436 222 498 222 498 262" fill="none" stroke={`url(#g-gold-${variant})`} strokeWidth="5" strokeLinecap="round" />
        <image href="/logo-mark.png" x="440" y="296" width="54" height="62" preserveAspectRatio="xMidYMid meet" opacity="0.95" />
        <rect x="438" y="366" width="56" height="3" fill="#c8a96b" opacity="0.7" />
      </g>

      {/* gold spheres */}
      <circle cx="196" cy="398" r="17" fill={`url(#g-sphere-${variant})`} />
      <circle cx="568" cy="404" r="13" fill={`url(#g-sphere-${variant})`} />
      {!compact && <circle cx="618" cy="372" r="24" fill={`url(#g-sphere-${variant})`} />}
      {!compact && <circle cx="236" cy="150" r="9" fill={`url(#g-sphere-${variant})`} />}
      {/* sparkle */}
      <path d="M560 150 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6 Z" fill={`url(#g-gold-${variant})`} opacity="0.9" />
    </svg>
  );
}
