import { useMemo } from "react";

interface ParticlesBackgroundProps {
  count?: number;
  className?: string;
}

export const ParticlesBackground = ({ count = 30, className = "" }: ParticlesBackgroundProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const size = 3 + Math.random() * 10;
        return {
          key: i,
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          duration: `${14 + Math.random() * 18}s`,
          delay: `${Math.random() * 12}s`,
          opacity: 0.15 + Math.random() * 0.35,
        };
      }),
    [count]
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      {particles.map((p) => (
        <span
          key={p.key}
          className="particle"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};
