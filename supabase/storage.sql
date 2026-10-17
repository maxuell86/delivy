-- =========================================================
-- STORAGE DAS IMAGENS DA LOJA (capa, banners, logo...)
-- =========================================================
-- Rode este arquivo no SQL Editor do Supabase DA LOJA (o mesmo do
-- config-loja.sql), uma vez.
--
-- Cria o bucket publico "loja-imagens" e libera:
--   - leitura publica (as imagens aparecem no app);
--   - upload/alteracao apenas por usuarios logados (authenticated).
--
-- Observacao: hoje o painel do lojista entra por senha simples (sem login
-- Supabase), entao o upload funciona apenas se o projeto permitir escrita
-- anonima. Se quiser permitir o upload sem login (fase atual), descomente o
-- bloco "ESCRITA ANONIMA" no fim. Ao migrar para o Supabase Auth (fase 4),
-- remova esse bloco para exigir login.

insert into storage.buckets (id, name, public)
values ('loja-imagens', 'loja-imagens', true)
on conflict (id) do update set public = true;

-- Leitura publica das imagens
drop policy if exists "loja-imagens leitura publica" on storage.objects;
create policy "loja-imagens leitura publica"
  on storage.objects for select
  using (bucket_id = 'loja-imagens');

-- Escrita por usuarios autenticados (fase futura, com Supabase Auth)
drop policy if exists "loja-imagens escrita autenticada" on storage.objects;
create policy "loja-imagens escrita autenticada"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'loja-imagens');

drop policy if exists "loja-imagens update autenticado" on storage.objects;
create policy "loja-imagens update autenticado"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'loja-imagens');

-- =========================================================
-- ESCRITA ANONIMA (descomente apenas enquanto nao houver login)
-- =========================================================
-- Necessario hoje porque o painel do lojista usa senha simples, sem sessao
-- Supabase. Sem isto, o botao de upload responde "new row violates row-level
-- security policy".
--
-- drop policy if exists "loja-imagens escrita anonima" on storage.objects;
-- create policy "loja-imagens escrita anonima"
--   on storage.objects for insert
--   to anon
--   with check (bucket_id = 'loja-imagens');
