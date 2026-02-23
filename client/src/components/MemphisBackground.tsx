/**
 * Memphis-style geometric background decorations.
 * Renders floating shapes (circles, triangles, rectangles, dots, diamonds)
 * with soft pastel colors for a playful, energetic aesthetic.
 */
export default function MemphisBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Large circle - top right */}
      <div
        className="absolute -top-8 -right-12 w-40 h-40 rounded-full border-[3px] border-black/10 bg-[#A8E6CF]/30 memphis-float"
        style={{ animationDelay: "0s" }}
      />

      {/* Triangle - top left */}
      <svg
        className="absolute top-20 left-6 w-16 h-16 memphis-float-reverse"
        style={{ animationDelay: "1s" }}
        viewBox="0 0 64 64"
      >
        <polygon
          points="32,4 60,56 4,56"
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="2.5"
        />
        <polygon points="32,8 56,52 8,52" fill="#C3B1E1" opacity="0.3" />
      </svg>

      {/* Small filled circle - mid left */}
      <div
        className="absolute top-[45%] -left-4 w-20 h-20 rounded-full bg-[#FFEAA7]/40 memphis-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Rectangle - bottom right */}
      <div
        className="absolute bottom-32 right-8 w-14 h-24 border-[2.5px] border-black/10 bg-[#FFB7B2]/25 rotate-12 memphis-float-reverse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Diamond - mid right */}
      <div
        className="absolute top-[35%] right-12 w-10 h-10 border-[2px] border-black/10 bg-[#87CEEB]/30 rotate-45 memphis-float"
        style={{ animationDelay: "3s" }}
      />

      {/* Dots pattern - bottom left */}
      <div className="absolute bottom-20 left-10 grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-black/10"
          />
        ))}
      </div>

      {/* Small circle - bottom center */}
      <div
        className="absolute bottom-12 left-1/2 w-8 h-8 rounded-full border-[2px] border-black/10 bg-[#C3B1E1]/25 memphis-float"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Zigzag line - top center */}
      <svg
        className="absolute top-8 left-1/3 w-24 h-6 memphis-float-reverse"
        style={{ animationDelay: "2.5s" }}
        viewBox="0 0 96 24"
      >
        <polyline
          points="0,20 16,4 32,20 48,4 64,20 80,4 96,20"
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Cross/plus - bottom right area */}
      <svg
        className="absolute bottom-[40%] right-4 w-8 h-8"
        viewBox="0 0 32 32"
      >
        <line x1="16" y1="4" x2="16" y2="28" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
        <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
