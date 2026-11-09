"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { id: string; category: string; title: string; summary: string; requires_ack: boolean };

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, reduced, slides.length]);

  if (slides.length === 0) return null;
  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <section className="hero" aria-roledescription="carrossel" aria-label="Comunicados em destaque" onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div aria-live={paused ? "polite" : "off"}>
        <span className="tag">{s.category}</span>
        {s.requires_ack && (
          <span className="badge warn" style={{ marginLeft: 8 }}>
            Exige ciência
          </span>
        )}
        <h2>{s.title}</h2>
        {s.summary && <p>{s.summary}</p>}
        <Link className="btn" href={`/comunicados/${s.id}`}>
          Ler comunicado
        </Link>
      </div>
      {slides.length > 1 && (
        <div className="hero-controls">
          {slides.map((x, n) => (
            <button key={x.id} type="button" className="dot" aria-label={`Comunicado ${n + 1} de ${slides.length}`} aria-current={n === i ? "true" : undefined} onClick={() => setI(n)}>
              <span />
            </button>
          ))}
          <button type="button" className="ctl" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Retomar rotação" : "Pausar rotação"} title={paused ? "Retomar" : "Pausar"}>
            {paused ? "▶" : "❚❚"}
          </button>
        </div>
      )}
    </section>
  );
}
