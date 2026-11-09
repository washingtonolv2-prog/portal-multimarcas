export default function Loading() {
  return (
    <div className="skel-wrap" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="skel" style={{ height: 34, width: 260 }} />
      <div className="skel-cols">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skel" style={{ height: 44, width: 240, borderRadius: 999 }} />
          <div className="skel" style={{ height: 96 }} />
          <div className="skel" style={{ height: 96 }} />
          <div className="skel" style={{ height: 96 }} />
        </div>
        <div className="skel" style={{ height: 340 }} />
      </div>
    </div>
  );
}
