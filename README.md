# Portal Multimarcas

Portal interno de comunicação e arquivos para as lojas. Next.js 16 + Supabase (login, dados) + Dropbox (arquivos, somente leitura).

**Os arquivos ficam no Dropbox.** O Supabase guarda só usuários, lojas, comunicados, permissões e o log de downloads. Ao clicar num arquivo, o servidor confere o login e a permissão e redireciona para um link temporário do Dropbox (válido por ~4 horas).

## 1. Supabase

1. Crie um projeto (ou use um existente).
2. No SQL Editor, rode `supabase/migrations/0001_init.sql`.
3. **Authentication > Providers > Email:** desative "Allow new users to sign up". Os usuários são convidados por você (Authentication > Users > Invite user).
4. Copie `Project URL` e `anon key` (Project Settings > API) para o `.env.local`.

### Primeiro administrador

Convide seu e-mail em Authentication > Users e rode no SQL Editor:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'SEU@EMAIL');
```

### Ligar usuários às lojas

Cadastre as lojas em **Administração > Lojas** e vincule cada usuário (por enquanto, via SQL):

```sql
insert into public.profile_stores (profile_id, store_id)
select u.id, s.id from auth.users u, public.stores s
where u.email = 'gerente@loja.com' and s.name = 'Tijuca';
```

Perfis: `admin` (publica e administra), `supervisor` (vê tudo, não edita), `loja` (vê só o que é das suas lojas).

## 2. Dropbox (somente leitura)

1. Em https://www.dropbox.com/developers/apps crie um app: **Scoped access**, **Full Dropbox**.
2. Aba Permissions: marque **somente** `files.metadata.read` e `files.content.read`. Salve.
3. Recomendado: crie um usuário dedicado (ex.: `portal@suaempresa`) com permissão de **somente visualização** nas pastas. Assim a leitura é imposta também pelo próprio Dropbox.
4. Autorize o app com esse usuário abrindo (troque `APP_KEY`):

   `https://www.dropbox.com/oauth2/authorize?client_id=APP_KEY&response_type=code&token_access_type=offline&scope=files.metadata.read%20files.content.read`

   Copie o código mostrado e troque pelo refresh token:

   ```bash
   curl -s https://api.dropboxapi.com/oauth2/token -d code=CODIGO -d grant_type=authorization_code -u APP_KEY:APP_SECRET
   ```

   Guarde o `refresh_token` retornado.
5. Preencha no `.env.local` (e na Vercel): `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`.

### Dropbox Business (pastas de equipe)

Para enxergar as pastas de equipe, informe o namespace raiz da equipe. Com o token de acesso:

```bash
curl -s -X POST https://api.dropboxapi.com/2/users/get_current_account -H "Authorization: Bearer TOKEN"
```

Use `root_info.root_namespace_id` em `DROPBOX_ROOT_NAMESPACE_ID`. Se o app usar token de equipe, informe também `DROPBOX_SELECT_USER` (`dbmid:...`).

### Ligar pastas ao portal

Em **Administração > Pastas de arquivos**, informe o caminho da pasta no Dropbox (ex.: `/Lojas/Tabelas`) e escolha as lojas que podem vê-la. O portal guarda o **ID** da pasta, então mover ou renomear no Dropbox não quebra nada.

## 3. Rodar

```bash
cp .env.example .env.local   # preencha os valores
npm install
npm run dev
```

Deploy: importe o repositório na Vercel e configure as mesmas variáveis de ambiente. Nunca use o prefixo `NEXT_PUBLIC_` nas chaves do Dropbox.

## Segurança (resumo)

- RLS em todas as tabelas; o acesso a comunicados e pastas é decidido no banco.
- O download aceita só IDs do Dropbox, confirma que o arquivo está dentro da pasta liberada e registra quem baixou.
- O app do Dropbox só tem escopos de leitura: o portal não consegue apagar nem mover arquivos.
- Comunicados são exibidos como texto puro (sem HTML).

## Próximos passos sugeridos

- Tela de administração de usuários (convidar, ativar/desativar, vincular a lojas).
- Cache da listagem do Dropbox e atualização por webhook.
- Busca única em comunicados e arquivos.
- Notificações (e-mail/WhatsApp) para comunicados urgentes.
