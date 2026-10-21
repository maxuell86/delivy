-- =========================================================
-- CONFIGURACAO DA LOJA (painel customizar.html)
-- =========================================================
-- Rode este arquivo inteiro no SQL Editor do Supabase do restaurante.
--
-- Cria:
--   config_loja           -> guarda o que o lojista personalizou no painel
--                            (leitura publica - sao dados de vitrine, sem segredo)
--   config_loja_auth      -> hash da senha do painel (invisivel para o publico)
--   salvar_config_loja()  -> salva o que o painel manda (valida a senha)
--   verificar_senha_...() -> confere a senha (usada para entrar no painel)
--   trocar_senha_...()    -> troca a senha do painel
--   ler_config_loja()     -> leitura simples para as edge functions
--                            (Pix/cartao) usarem as mesmas regras
--
-- Senha inicial do painel: 142536   <-- TROQUE pelo proprio painel!
--
-- Observacao: quem tem a chave anon (publica, ela vai no app) pode LER a
-- config_loja, mas nao escrever - escrita so pelos RPCs abaixo, que exigem
-- a senha. A protecao e propositalmente simples (uso local/pequeno negocio).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------

create table if not exists public.config_loja (
  id            int primary key default 1 check (id = 1),
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.config_loja enable row level security;

drop policy if exists "config_loja leitura publica" on public.config_loja;
create policy "config_loja leitura publica"
  on public.config_loja for select
  using (true);

grant select on public.config_loja to anon, authenticated;

create table if not exists public.config_loja_auth (
  id         int primary key default 1 check (id = 1),
  senha_hash text not null
);

-- Sem policy nenhuma: com RLS ligado, ninguem sem service_role acessa.
alter table public.config_loja_auth enable row level security;

insert into public.config_loja_auth (id, senha_hash)
values (1, encode(digest('142536', 'sha256'), 'hex'))
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- Funcoes
-- ---------------------------------------------------------

create or replace function public.salvar_config_loja(p_senha text, p_dados jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.config_loja_auth
    where id = 1
      and senha_hash = encode(digest(coalesce(p_senha, ''), 'sha256'), 'hex')
  ) then
    raise exception 'Senha incorreta';
  end if;

  insert into public.config_loja (id, dados, atualizado_em)
  values (1, coalesce(p_dados, '{}'::jsonb), now())
  on conflict (id) do update
    set dados         = excluded.dados,
        atualizado_em = now();
end;
$$;

create or replace function public.verificar_senha_config_loja(p_senha text)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.config_loja_auth
    where id = 1
      and senha_hash = encode(digest(coalesce(p_senha, ''), 'sha256'), 'hex')
  );
$$;

create or replace function public.trocar_senha_config_loja(p_senha_atual text, p_senha_nova text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.config_loja_auth
    where id = 1
      and senha_hash = encode(digest(coalesce(p_senha_atual, ''), 'sha256'), 'hex')
  ) then
    raise exception 'Senha atual incorreta';
  end if;

  if length(coalesce(p_senha_nova, '')) < 6 then
    raise exception 'A nova senha precisa de pelo menos 6 caracteres';
  end if;

  update public.config_loja_auth
     set senha_hash = encode(digest(p_senha_nova, 'sha256'), 'hex')
   where id = 1;
end;
$$;

create or replace function public.ler_config_loja()
returns jsonb
language sql
security definer
stable
as $$
  select coalesce((select dados from public.config_loja where id = 1), '{}'::jsonb);
$$;

grant execute on function public.salvar_config_loja(text, jsonb)           to anon, authenticated;
grant execute on function public.verificar_senha_config_loja(text)         to anon, authenticated;
grant execute on function public.trocar_senha_config_loja(text, text)      to anon, authenticated;
grant execute on function public.ler_config_loja()                         to anon, authenticated;

-- =========================================================
-- (Opcional - Fase 6) Edge functions do Pix/cartao
-- =========================================================
-- As edge functions de pagamento hoje tem os cupons/fidelidade chumbados
-- (SABORE10/15, 500/1000 etc). Para elas passarem a respeitar o que o
-- lojista configura no painel, troque os valores fixos por:
--
--   select valor from public.ler_config_loja() -> cupons / fidelidade / ...
--
-- Exemplo (dentro da funcao, em plpgsql):
--
--   declare cfg jsonb := public.ler_config_loja();
--   declare cupom jsonb := (
--     select c from jsonb_array_elements(cfg->'cupons') c
--     where upper(c->>'codigo') = upper(p_cupom_codigo)
--   );
--
-- Enquanto isso nao for feito, o painel muda a vitrine/regras do app, mas o
-- desconto efetivo cobrado no Pix/cartao continua sendo o configurado nas
-- edge functions (que ja documentam os mesmos numeros do config.js).
