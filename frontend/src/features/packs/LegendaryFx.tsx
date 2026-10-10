// Effets visuels d'une carte légendaire : flash, rayons, gerbe de particules.
// Le mouvement est coupé par la règle prefers-reduced-motion de index.css.

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const distance = 130 + ((i * 37) % 110);
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance),
    size: 4 + (i % 4) * 2,
    delay: (i % 7) * 35,
    color: ["#F59E0B", "#FBBF24", "#FFFFFF", "#FDE68A"][i % 4],
  };
});

export function LegendaryFx() {
  return (
    <>
      <div className="rv-flash pointer-events-none fixed inset-0 z-0 bg-[#FBBF24]" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
        <div
          className="rv-rays h-[26rem] w-[26rem] rounded-full opacity-40"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, #F59E0B 12deg, transparent 28deg, transparent 60deg, #FBBF24 72deg, transparent 88deg, transparent 120deg, #F59E0B 132deg, transparent 148deg, transparent 180deg, #FBBF24 192deg, transparent 208deg, transparent 240deg, #F59E0B 252deg, transparent 268deg, transparent 300deg, #FBBF24 312deg, transparent 328deg)",
            maskImage: "radial-gradient(circle, black 15%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle, black 15%, transparent 70%)",
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="rv-burst absolute rounded-full"
            style={
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                animationDelay: `${p.delay + 150}ms`,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                opacity: 0,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
