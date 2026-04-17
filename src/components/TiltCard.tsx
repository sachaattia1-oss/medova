import { ReactNode, useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation angle in degrees (default 8) */
  maxTilt?: number;
  /** Lift on hover in pixels (default 6) */
  lift?: number;
}

/**
 * Wrapper that applies a subtle 3D tilt following the mouse position.
 * Pure CSS transforms — no library required.
 */
export const TiltCard = ({ children, className, maxTilt = 8, lift = 6 }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 -> 1
    const y = (e.clientY - rect.top) / rect.height; // 0 -> 1
    const rotateY = (x - 0.5) * 2 * maxTilt; // left/right
    const rotateX = -(y - 0.5) * 2 * maxTilt; // up/down
    node.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-${lift}px)`;
  };

  const reset = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={cn(
        "transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};
