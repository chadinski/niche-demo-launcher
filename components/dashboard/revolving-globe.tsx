"use client";

const points = [
  { top: "36%", left: "28%", delay: "0s" },
  { top: "48%", left: "62%", delay: ".4s" },
  { top: "62%", left: "44%", delay: ".8s" },
  { top: "30%", left: "58%", delay: "1.2s" },
  { top: "55%", left: "24%", delay: "1.6s" },
];

export function RevolvingGlobe() {
  return (
    <div className="seraphim-globe-wrap" aria-label="Animated lead intelligence network" role="img">
      <div className="seraphim-globe-orbit seraphim-globe-orbit-a" />
      <div className="seraphim-globe-orbit seraphim-globe-orbit-b" />
      <div className="seraphim-globe">
        <div className="seraphim-globe-grid" />
        <div className="seraphim-globe-shine" />
        <div className="seraphim-globe-arc seraphim-globe-arc-a" />
        <div className="seraphim-globe-arc seraphim-globe-arc-b" />
        <div className="seraphim-globe-arc seraphim-globe-arc-c" />
        {points.map((point, index) => (
          <span
            key={`${point.top}-${point.left}`}
            className="seraphim-globe-point"
            style={{ top: point.top, left: point.left, animationDelay: point.delay }}
          >
            <span className="sr-only">Lead point {index + 1}</span>
          </span>
        ))}
      </div>
      <div className="seraphim-globe-caption">
        <span>Lead signals</span>
        <strong>Jamaica - US - Caribbean</strong>
      </div>
    </div>
  );
}
