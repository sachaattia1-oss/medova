import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Stethoscope, Microscope, Brain, Heart } from "lucide-react";

const chapters = [
  { icon: Heart, title: "Anatomie cardiaque", progress: 100 },
  { icon: Brain, title: "Neurosciences", progress: 75 },
  { icon: Microscope, title: "Histologie", progress: 60 },
  { icon: Stethoscope, title: "Sémiologie", progress: 40 },
];

const BookScrollAnimation = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // Total scrollable distance for the sticky section = section height - viewport height
      const total = node.offsetHeight - viewportH;
      // How far we've scrolled past the top of the section
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      setProgress(p);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    // IntersectionObserver to avoid extra work when off-screen
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) handleScroll();
        });
      },
      { threshold: 0 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      obs.disconnect();
    };
  }, []);

  const leftRotate = -160 * progress;
  const rightRotate = 160 * progress;
  const pagesOpacity = progress > 0.4 ? Math.min((progress - 0.4) / 0.6, 1) : 0;
  const pagesVisible = progress > 0.3;

  // Circular progress for QCM
  const qcmScore = 78;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const circleProgress = (pagesOpacity * qcmScore) / 100;
  const dashOffset = circumference * (1 - circleProgress);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-gray-950"
      style={{ height: "300vh" }}
      aria-label="Aperçu du programme"
    >
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Background ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(172 70% 25% / 0.25) 0%, transparent 60%)",
          }}
        />

        {/* Header */}
        <div className="relative z-10 text-center mb-10 md:mb-16 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Tout ton programme, organisé pour toi
          </h2>
          <p className="mt-4 text-base md:text-lg text-teal-400">
            Conçu par des étudiants en médecine, pour des étudiants en médecine
          </p>
        </div>

        {/* 3D Scene */}
        <div
          className="relative z-10 flex justify-center items-center"
          style={{ perspective: "1200px" }}
        >
          <div
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              width: "300px",
              height: "400px",
            }}
          >
            {/* Inner pages (left) */}
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{
                width: "50%",
                background: "linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)",
                borderTopLeftRadius: "8px",
                borderBottomLeftRadius: "8px",
                boxShadow: "inset -8px 0 16px -8px rgba(0,0,0,0.15)",
                opacity: pagesOpacity,
                transition: "opacity 0.2s ease-out",
                pointerEvents: pagesVisible ? "auto" : "none",
              }}
            >
              <div className="p-4 h-full flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-teal-200 pb-2">
                  Programme S1
                </h3>
                <ul className="space-y-2.5 flex-1">
                  {chapters.map((c) => {
                    const Icon = c.icon;
                    return (
                      <li key={c.title} className="text-[10px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                          <Icon className="h-3 w-3 text-teal-600" />
                          <span className="font-semibold text-gray-800 truncate">
                            {c.title}
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                            style={{ width: `${c.progress * pagesOpacity}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Inner pages (right) */}
            <div
              className="absolute top-0 right-0 h-full overflow-hidden"
              style={{
                width: "50%",
                background: "linear-gradient(225deg, #fafafa 0%, #f1f5f9 100%)",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                boxShadow: "inset 8px 0 16px -8px rgba(0,0,0,0.15)",
                opacity: pagesOpacity,
                transition: "opacity 0.2s ease-out",
                pointerEvents: pagesVisible ? "auto" : "none",
              }}
            >
              <div className="p-4 h-full flex flex-col items-center text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-teal-200 pb-2 w-full">
                  Ton score QCM
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="relative h-28 w-28">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="url(#qcmGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 0.2s ease-out" }}
                      />
                      <defs>
                        <linearGradient id="qcmGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-teal-600">
                        {Math.round(qcmScore * pagesOpacity)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-gray-700">
                    Continue tes révisions
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-teal-600">
                    <BookOpen className="h-3 w-3" />
                    <span>+12% cette semaine</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Book spine */}
            <div
              className="absolute top-0 left-1/2 h-full pointer-events-none"
              style={{
                width: "6px",
                transform: "translateX(-50%)",
                background:
                  "linear-gradient(to right, hsl(172 60% 18%), hsl(172 70% 35%), hsl(172 60% 18%))",
                zIndex: 5,
                boxShadow: "0 0 12px hsl(172 70% 35% / 0.5)",
              }}
            />

            {/* Cover left */}
            <div
              className="absolute top-0 left-0 h-full"
              style={{
                width: "50%",
                transformOrigin: "right center",
                transform: `rotateY(${leftRotate}deg)`,
                backfaceVisibility: "hidden",
                background:
                  "linear-gradient(135deg, hsl(172 70% 22%) 0%, hsl(172 60% 14%) 100%)",
                borderTopLeftRadius: "8px",
                borderBottomLeftRadius: "8px",
                boxShadow:
                  "0 20px 40px -10px rgba(0,0,0,0.6), inset -2px 0 8px rgba(0,0,0,0.4)",
                transition: "transform 0.05s linear",
                zIndex: 10,
              }}
            >
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 border-r border-teal-900/40">
                <div className="mb-3 rounded-full bg-teal-500/20 p-3 ring-1 ring-teal-400/40">
                  <BookOpen className="h-7 w-7 text-teal-300" />
                </div>
                <h3 className="text-white font-bold text-lg tracking-wide">
                  MED<span className="text-teal-400">OVA</span>
                </h3>
                <p className="text-teal-200/80 text-[10px] mt-1 uppercase tracking-widest">
                  Programme PASS
                </p>
                <div className="mt-4 h-px w-12 bg-teal-400/50" />
                <p className="text-teal-100/70 text-[9px] mt-3 italic">
                  Ouvre-moi
                </p>
              </div>
            </div>

            {/* Cover right */}
            <div
              className="absolute top-0 right-0 h-full"
              style={{
                width: "50%",
                transformOrigin: "left center",
                transform: `rotateY(${rightRotate}deg)`,
                backfaceVisibility: "hidden",
                background:
                  "linear-gradient(225deg, hsl(172 70% 22%) 0%, hsl(172 60% 14%) 100%)",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                boxShadow:
                  "0 20px 40px -10px rgba(0,0,0,0.6), inset 2px 0 8px rgba(0,0,0,0.4)",
                transition: "transform 0.05s linear",
                zIndex: 10,
              }}
            >
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 border-l border-teal-900/40">
                <div className="text-teal-300/70 text-[9px] uppercase tracking-widest">
                  Édition 2025
                </div>
                <div className="mt-3 h-20 w-20 rounded-full border border-teal-400/30 flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-teal-300/80" />
                </div>
                <p className="text-teal-100/70 text-[10px] mt-4 max-w-[80%]">
                  Le compagnon des futurs médecins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 mt-10 text-center">
          <p className="text-xs text-teal-400/60 uppercase tracking-widest">
            {progress < 0.95 ? "Continue à scroller ↓" : "✨ Programme dévoilé"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookScrollAnimation;
