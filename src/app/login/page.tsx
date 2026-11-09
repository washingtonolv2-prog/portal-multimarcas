import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <main className="login-box">
      <div className="card">
        <h1>Portal Multimarcas</h1>
        {erro && <div className="error">{erro}</div>}
        <form action={signIn} className="stack">
          <label>
            E-mail
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label>
            Senha
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
