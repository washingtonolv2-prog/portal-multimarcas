"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

type Store = { id: string; name: string };
const CATEGORIES = ["Campanha", "Operação", "Preços", "Aviso"];

function Switch({ label, desc, on, set, id }: { label: string; desc: string; on: boolean; set: (v: boolean) => void; id: string }) {
  return (
    <div className="switch">
      <span className="txt">
        <b id={id}>{label}</b>
        <small>{desc}</small>
      </span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={id} onClick={() => set(!on)}>
        <span className="track" />
      </button>
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (label === "Agendar comunicado" ? "Agendando…" : "Publicando…") : label}
    </button>
  );
}

export default function PublishForm({
  stores,
  minNow,
  action,
  initialError,
}: {
  stores: Store[];
  minNow: string;
  action: (fd: FormData) => void;
  initialError?: string;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Aviso");
  const [ack, setAck] = useState(false);
  const [featured, setFeatured] = useState(true);
  const [dest, setDest] = useState<"todas" | "lojas">("todas");
  const [sel, setSel] = useState<string[]>([]);
  const [schedule, setSchedule] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const titleErr = touched && !title.trim();
  const names = stores.filter((s) => sel.includes(s.id)).map((s) => s.name);
  const para = dest === "todas" ? "todas as lojas" : names.length ? names.join(", ") : "nenhuma loja escolhida";

  return (
    <form
      action={action}
      className="stack"
      onChange={() => setDirty(true)}
      onSubmit={(e) => {
        if (!title.trim()) {
          e.preventDefault();
          setTouched(true);
          document.getElementById("title")?.focus();
        }
      }}
    >
      {initialError && <div className="error">{initialError}</div>}
      <div className="pub-grid">
        <section className="card" aria-label="Conteúdo do comunicado" style={{ display: "grid", gap: 20, padding: "24px 28px" }}>
          <label>
            Título
            <input id="title" type="text" name="title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={titleErr} aria-describedby={titleErr ? "title-err" : undefined} />
            {titleErr && (
              <span id="title-err" role="alert" className="field-error">
                Escreva um título para publicar. Ele aparece em destaque para as lojas.
              </span>
            )}
          </label>

          <div role="group" aria-labelledby="cat-l" style={{ display: "grid", gap: 8 }}>
            <span id="cat-l" style={{ fontWeight: 600, fontSize: ".9rem" }}>
              Categoria
            </span>
            <div className="pills">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" className="pill" aria-pressed={c === category} onClick={() => { setCategory(c); setDirty(true); }}>
                  {c}
                </button>
              ))}
            </div>
            <input type="hidden" name="category" value={category} />
          </div>

          <label>
            <span className="row" style={{ flexWrap: "nowrap" }}>
              <span>Resumo para o destaque</span>
              <span className="muted" style={{ fontWeight: 400 }}>
                {summary.length}/140
              </span>
            </span>
            <textarea name="summary" maxLength={140} rows={2} style={{ minHeight: 72 }} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>

          <label>
            Mensagem
            <textarea name="body" required />
          </label>
        </section>

        <aside style={{ display: "grid", gap: 16 }}>
          <section className="preview" aria-label="Prévia">
            <span className="cap">Como vai aparecer no destaque</span>
            <div>
              <span className="tag" style={{ display: "inline-block", fontSize: ".72rem", fontWeight: 600, textTransform: "uppercase", padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.18)" }}>
                {category}
              </span>
              {ack && (
                <span className="badge warn" style={{ marginLeft: 8 }}>
                  Exige ciência
                </span>
              )}
            </div>
            <h3>{title || "Título do comunicado"}</h3>
            <p>{summary || "O resumo aparece aqui."}</p>
            {!featured && <p style={{ color: "#fcefd6" }}>Destaque desligado: aparece só na lista de comunicados.</p>}
            <span style={{ fontSize: ".85rem", color: "#cfe6dc", borderTop: "1px solid rgba(255,255,255,.2)", paddingTop: 10 }}>Para: {para}</span>
          </section>

          <section className="card" style={{ display: "grid", gap: 12, margin: 0 }}>
            <strong>Para quem</strong>
            <div className="pills" role="group" aria-label="Destino">
              <button type="button" className="pill" aria-pressed={dest === "todas"} onClick={() => setDest("todas")}>
                Todas as lojas
              </button>
              <button type="button" className="pill" aria-pressed={dest === "lojas"} onClick={() => setDest("lojas")}>
                Escolher lojas
              </button>
            </div>
            {dest === "lojas" && (
              <div className="pills" role="group" aria-label="Lojas">
                {stores.map((s) => (
                  <button key={s.id} type="button" className="pill" aria-pressed={sel.includes(s.id)} onClick={() => { setSel((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id])); setDirty(true); }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {dest === "lojas" && sel.map((id) => <input key={id} type="hidden" name="store_ids" value={id} />)}
          </section>

          <section className="card" style={{ display: "grid", gap: 12, margin: 0 }}>
            <strong>Quando</strong>
            <div className="pills" role="group" aria-label="Publicação">
              <button type="button" className="pill" aria-pressed={!schedule} onClick={() => setSchedule(false)}>
                Publicar agora
              </button>
              <button type="button" className="pill" aria-pressed={schedule} onClick={() => setSchedule(true)}>
                Agendar
              </button>
            </div>
            {schedule && (
              <label>
                Publicar em
                <input type="datetime-local" name="publish_at" min={minNow} required />
              </label>
            )}
            <label>
              <span>
                Sai do ar em <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span>
              </span>
              <input type="datetime-local" name="expires_at" min={minNow} />
            </label>
          </section>

          <section className="card" style={{ display: "grid", gap: 4, margin: 0 }}>
            <Switch id="sw1" label="Exigir ciência" desc="Cada loja precisa confirmar que leu." on={ack} set={(v) => { setAck(v); setDirty(true); }} />
            <Switch id="sw2" label="Mostrar no destaque" desc="Aparece no topo da página inicial." on={featured} set={(v) => { setFeatured(v); setDirty(true); }} />
            {ack && <input type="hidden" name="requires_ack" value="on" />}
            {featured && <input type="hidden" name="featured" value="on" />}
          </section>
        </aside>
      </div>

      {confirming && (
        <section role="alertdialog" aria-labelledby="dc-t" aria-describedby="dc-d" className="card row" style={{ borderColor: "#b3641a" }}>
          <div style={{ flex: "1 1 320px" }}>
            <strong id="dc-t">Descartar o que você escreveu?</strong>
            <div id="dc-d" className="muted">
              Se sair agora, o texto deste comunicado será perdido.
            </div>
          </div>
          <div className="actions">
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Continuar editando
            </button>
            <Link className="btn secondary" href="/admin/comunicados">
              Descartar e sair
            </Link>
          </div>
        </section>
      )}

      <div className="actions">
        {dirty ? (
          <button type="button" className="link" onClick={() => setConfirming(true)}>
            Cancelar
          </button>
        ) : (
          <Link className="btn secondary" href="/admin/comunicados" style={{ background: "none" }}>
            Cancelar
          </Link>
        )}
        <Submit label={schedule ? "Agendar comunicado" : "Publicar comunicado"} />
      </div>
    </form>
  );
}
