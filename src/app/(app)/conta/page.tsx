import { requireProfile } from "@/lib/auth";
import { MIN_PASSWORD, roleLabel } from "@/lib/roles";
import { changePassword } from "./actions";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const profile = await requireProfile();
  const { erro, ok } = await searchParams;

  return (
    <>
      <h1>Minha conta</h1>
      <p className="muted">
        {profile.full_name} · {roleLabel(profile.role)}
      </p>
      {erro && <div className="error">{erro}</div>}
      {ok && <div className="card">{ok}</div>}

      <h2>Trocar senha</h2>
      <form action={changePassword} className="stack">
        <label>
          Nova senha (mínimo {MIN_PASSWORD} caracteres)
          <input type="password" name="password" minLength={MIN_PASSWORD} autoComplete="new-password" required />
        </label>
        <label>
          Repita a nova senha
          <input type="password" name="confirm" minLength={MIN_PASSWORD} autoComplete="new-password" required />
        </label>
        <button className="btn" type="submit">
          Trocar senha
        </button>
      </form>
    </>
  );
}
