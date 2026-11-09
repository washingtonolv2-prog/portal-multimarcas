-- Fecha o acesso anonimo as funcoes security definer (expostas via /rest/v1/rpc).
-- As policies usam as funcoes apenas para usuarios autenticados; o trigger roda como dono da tabela.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.can_see_all() from public, anon;
revoke execute on function public.user_store_ids() from public, anon;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_see_all() to authenticated;
grant execute on function public.user_store_ids() to authenticated;
