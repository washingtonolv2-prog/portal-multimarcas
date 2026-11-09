import { signIn } from "./actions";
import LoginSubmit from "@/components/LoginSubmit";
import "./login.css";

const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <div className="lg">
      <section className="lg-hero">
        <div className="lg-brand">
          <span>PM</span>
          Portal Multimarcas
        </div>
        <div>
          <h1>Tudo da operação, num só lugar.</h1>
          <p>Comunicados das marcas e arquivos das lojas, sempre atualizados e sem pasta perdida.</p>
        </div>
        <ul>
          <li>
            <svg {...ICON}>
              <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
              <path d="M15 9a4 4 0 0 1 0 6" />
            </svg>
            Comunicados com confirmação de leitura
          </li>
          <li>
            <svg {...ICON}>
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Arquivos organizados por loja e marca
          </li>
          <li>
            <svg {...ICON}>
              <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
            </svg>
            Cada pessoa vê só o que é da sua loja
          </li>
        </ul>
      </section>
      <section className="lg-side">
        <form action={signIn} className="lg-form">
          <div>
            <h2>Entrar</h2>
            <p className="sub">Use o e-mail cadastrado pelo administrador.</p>
          </div>
          {erro && (
            <div className="error" role="alert" style={{ margin: 0 }}>
              {erro}
            </div>
          )}
          <label>
            E-mail
            <input type="email" name="email" autoComplete="username" placeholder="nome@empresa.com.br" required />
          </label>
          <label>
            Senha
            <input type="password" name="password" autoComplete="current-password" placeholder="Sua senha" required />
          </label>
          <LoginSubmit />
          <p className="foot">Primeiro acesso ou esqueceu a senha? Fale com o administrador do portal.</p>
        </form>
      </section>
    </div>
  );
}
