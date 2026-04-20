"use client";

interface CorefitLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function CorefitLogo({
  size = "md",
  showText = true,
}: CorefitLogoProps) {
  const sizes = {
    sm: { icon: 26, text: 13, gap: 8 },
    md: { icon: 34, text: 16, gap: 10 },
    lg: { icon: 46, text: 22, gap: 14 },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center relative" style={{ gap: s.gap }}>
      {/* ICON */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: s.icon * 1.4, height: s.icon }}
      >
        {/* glow controlado */}
        <div
          className="absolute"
          style={{
            width: s.icon,
            height: s.icon * 0.4,
            background:
              "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)",
            bottom: -4,
            filter: "blur(6px)",
          }}
        />

        <svg viewBox="0 0 80 50" className="relative z-10">
          <defs>
            <linearGradient id="green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>

            <linearGradient id="white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>

          {/* C */}
          <path
            d="M10 8 
               L34 5 
               L30 16 
               L20 18 
               L18 25 
               L20 32 
               L30 34 
               L34 26 
               L42 26 
               L36 45 
               L8 45 
               L4 25 
               Z"
            fill="url(#green)"
          />

          {/* F */}
          <path
            d="M36 5 
               L68 2 
               L65 12 
               L50 14 
               L48 20 
               L60 18 
               L58 26 
               L46 28 
               L42 48 
               L30 48 
               Z"
            fill="url(#white)"
          />

          {/* swoosh */}
          <path
            d="M6 42 Q30 36 60 40 T78 34"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* TEXT */}
      {showText && (
        <div
          className="font-semibold tracking-tight"
          style={{
            fontSize: s.text,
            letterSpacing: "-0.03em",
          }}
        >
          <span
            style={{
              backgroundImage:
                "linear-gradient(135deg, #4ade80 0%, #22c55e 70%, #16a34a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CORE
          </span>
          <span className="text-white">FIT</span>
        </div>
      )}
    </div>
  );
}