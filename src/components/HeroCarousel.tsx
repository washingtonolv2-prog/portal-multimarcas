"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { id: string; category: string; title: string; summary: string; requires_ack: boolean; date: string };
const BG = ["#134536", "#1B5E47", "#2B6F58", "#0F3A2D"];

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

  const n = slides.length;
  const s = n ? slides[Math.min(i, n - 1)] : null;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section className="hero" style={{ background: BG[i % BG.length] }} aria-roledescription="carrossel" aria-label="Comunicados em destaque">
      <svg className="hero-art" aria-hidden="true" width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
        <path d="M15 9a4 4 0 0 1 0 6" />
        <path d="M18 6.5a8 8 0 0 1 0 11" />
      </svg>
      {s ? (
        <>
          <div className="hero-body">
            <div className="hero-meta">
              <span className="tag">{s.category}</span>
              {s.requires_ack && <span className="tag-warn">Exige ciência</span>}
              <span className="hero-date">{s.date}</span>
            </div>
            <h2 aria-live="off">{s.title}</h2>
            {s.summary && <p>{s.summary}</p>}
          </div>
          <div className="hero-foot">
            <Link className="hero-cta" href={`/comunicados/${s.id}`}>
              Ler comunicado
            </Link>
            {n > 1 && (
              <div className="hero-arrows">
                <button type="button" aria-label="Comunicado anterior" onClick={() => go(-1)}>
                  ‹
                </button>
                <button type="button" aria-label={paused ? "Retomar rotação" : "Pausar rotação"} onClick={() => setPaused((p) => !p)}>
                  {paused ? "▶" : "❚❚"}
                </button>
                <button type="button" aria-label="Próximo comunicado" onClick={() => go(1)}>
                  ›
                </button>
              </div>
            )}
            {n > 1 && (
              <div className="hero-dots">
                <div>
                  {slides.map((x, k) => (
                    <button key={x.id} type="button" aria-label={`Comunicado ${k + 1} de ${n}`} aria-current={k === i ? "true" : undefined} onClick={() => setI(k)}>
                      <span style={{ width: k === i ? 28 : 8, background: k === i ? "#fff" : "rgba(255,255,255,.4)" }} />
                    </button>
                  ))}
                </div>
                <span>
                  {i + 1} de {n}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="hero-body">
          <div className="hero-meta">
            <span className="tag">Comunicados</span>
          </div>
          <h2>Nenhum comunicado em destaque</h2>
          <p>Quando a gerência publicar um aviso em destaque, ele aparece aqui.</p>
        </div>
      )}
    </section>
  );
}
