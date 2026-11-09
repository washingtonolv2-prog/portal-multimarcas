import "../motion.css";

// O template é recriado a cada troca de página: reinicia a animação de entrada.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-anim">{children}</div>;
}
