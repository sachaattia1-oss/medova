interface FloatingShapesProps {
  className?: string;
}

/**
 * Decorative slow-moving geometric shapes (blobs, circles, rings)
 * for use as a fixed page background. Pure CSS animations.
 */
export const FloatingShapes = ({ className = "" }: FloatingShapesProps) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Large soft blobs */}
      <div
        className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.18), transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full blur-3xl animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.14), transparent 70%)",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[26rem] h-[26rem] rounded-full blur-3xl animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent-hover) / 0.16), transparent 70%)",
          animationDelay: "8s",
        }}
      />

      {/* Outline rings */}
      <div
        className="absolute top-[20%] right-[15%] w-40 h-40 rounded-full border border-accent/15 animate-blob"
        style={{ animationDuration: "22s" }}
      />
      <div
        className="absolute bottom-[15%] left-[8%] w-28 h-28 rounded-full border border-primary/15 animate-blob"
        style={{ animationDuration: "26s", animationDelay: "3s" }}
      />

      {/* Small filled circles */}
      <div
        className="absolute top-[60%] left-[12%] w-6 h-6 rounded-full bg-accent/20 animate-float"
      />
      <div
        className="absolute top-[15%] left-[55%] w-4 h-4 rounded-full bg-primary/25 animate-float-delayed"
      />
      <div
        className="absolute bottom-[25%] right-[20%] w-5 h-5 rounded-full bg-accent/20 animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Rotated square */}
      <div
        className="absolute top-[40%] left-[5%] w-12 h-12 rotate-45 border border-accent/15 animate-blob"
        style={{ animationDuration: "20s", animationDelay: "5s" }}
      />
    </div>
  );
};
