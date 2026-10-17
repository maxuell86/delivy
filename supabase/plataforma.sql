-- =========================================================
-- CONTROL PLANE DA PLATAFORMA (Delivy SaaS)
-- =========================================================
-- Rode este arquivo inteiro no SQL Editor do Supabase DA PLATAFORMA
-- (um projeto Supabase so para o cadastro das lojas - separado do Supabase
-- de cada restaurante, que continua sendo o "data plane").
--
-- Cria:
--   lojas                    -> cadastro de cada estabelecimento
--   plataforma_auth          -> hash da senha do painel master (invisivel)
--   resolver_loja()          -> publico: o app descobre a loja pelo slug
--   verificar_senha_plataforma()
--   listar_lojas()           -> painel master
--   criar_loja()             -> painel master (valida a senha)
--   atualizar_loja()         -> painel master (valida a senha)
--   excluir_loja()           -> painel master (valida a senha)
--   trocar_senha_plataforma()-> troca a senha do painel master
--
-- Senha inicial do painel master: delivy2024   <-- TROQUE depois de entrar!
--
-- A anon key de cada loja fica guardada aqui e e devolvida por resolver_loja()
-- porque ela e PUBLICA por natureza (vai no navegador do cliente da loja).
-- Nunca coloque aqui a service_role key.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------

create table if not exists public.lojas (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  nome                   text not null,
  status                 text not null default 'trial',   -- trial | ativo | suspenso
  plano                  text not null default 'basico',
  supabase_url           text,
  supabase_anon_key      text,
  mercado_pago_public_key text,
  whatsapp               text,
  pix_chave              text,
  painel_gestao_url      text,
  dominio_custom         text,
  tema                   jsonb not null default '{}'::jsonb,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

-- Garante as colunas caso a tabela ja exista de uma versao anterior.
alter table public.lojas add column if not exists mercado_pago_public_key text;
alter table public.lojas add column if not exists painel_gestao_url text;
alter table public.lojas add column if not exists dominio_custom text;
alter table public.lojas add column if not exists tema jsonb not null default '{}'::jsonb;

-- Leitura/escrita direta bloqueadas: tudo passa pelos RPCs abaixo.
alter table public.lojas enable row level security;
-- (nenhuma policy = ninguem via anon/authenticated acessa a tabela direto)

create table if not exists public.plataforma_auth (
  id         int primary key default 1 check (id = 1),
  senha_hash text not null
);

alter table public.plataforma_auth enable row level security;

insert into public.plataforma_auth (id, senha_hash)
values (1, encode(digest('delivy2024', 'sha256'), 'hex'))
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------

create or replace function public._plataforma_senha_ok(p_senha text)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.plataforma_auth
    where id = 1
      and senha_hash = encode(digest(coalesce(p_senha, ''), 'sha256'), 'hex')
  );
$$;

-- ---------------------------------------------------------
-- Resolucao da loja (publico - usado pelo app no subdominio)
-- ---------------------------------------------------------

create or replace function public.resolver_loja(p_slug text)
returns table (
  slug              text,
  nome              text,
  status            text,
  supabase_url      text,
  supabase_anon_key text,
  whatsapp          text,
  pix_chave         text
)
language sql
security definer
stable
set search_path = public
as $$
  select l.slug, l.nome, l.status, l.supabase_url, l.supabase_anon_key, l.whatsapp, l.pix_chave
  from public.lojas l
  where lower(l.slug) = lower(trim(coalesce(p_slug, '')))
  limit 1;
$$;

-- ---------------------------------------------------------
-- Painel master (exige a senha da plataforma)
-- ---------------------------------------------------------

create or replace function public.verificar_senha_plataforma(p_senha text)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select public._plataforma_senha_ok(p_senha);
$$;

create or replace function public.listar_lojas(p_senha text)
returns setof public.lojas
language plpgsql
security definer
stable
set search_path = public, extensions
as $$
begin
  if not public._plataforma_senha_ok(p_senha) then
    raise exception 'Senha incorreta';
  end if;
  return query select * from public.lojas order by criado_em desc;
end;
$$;

create or replace function public.criar_loja(p_senha text, p_dados jsonb)
returns public.lojas
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_slug text := lower(trim(coalesce(p_dados->>'slug', '')));
  v_loja public.lojas;
begin
  if not public._plataforma_senha_ok(p_senha) then
    raise exception 'Senha incorreta';
  end if;

  if v_slug = '' then
    raise exception 'Informe o slug da loja';
  end if;
  if v_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' then
    raise exception 'Slug invalido: use apenas letras minusculas, numeros e hifen';
  end if;
  if exists (select 1 from public.lojas where lower(slug) = v_slug) then
    raise exception 'Ja existe uma loja com o slug "%"', v_slug;
  end if;

  insert into public.lojas (
    slug, nome, status, plano, supabase_url, supabase_anon_key,
    mercado_pago_public_key, whatsapp, pix_chave, painel_gestao_url, dominio_custom, tema
  ) values (
    v_slug,
    coalesce(nullif(trim(p_dados->>'nome'), ''), v_slug),
    coalesce(nullif(p_dados->>'status', ''), 'trial'),
    coalesce(nullif(p_dados->>'plano', ''), 'basico'),
    nullif(p_dados->>'supabase_url', ''),
    nullif(p_dados->>'supabase_anon_key', ''),
    nullif(p_dados->>'mercado_pago_public_key', ''),
    nullif(p_dados->>'whatsapp', ''),
    nullif(p_dados->>'pix_chave', ''),
    nullif(p_dados->>'painel_gestao_url', ''),
    nullif(p_dados->>'dominio_custom', ''),
    coalesce(p_dados->'tema', '{}'::jsonb)
  )
  returning * into v_loja;

  return v_loja;
end;
$$;

create or replace function public.atualizar_loja(p_senha text, p_id uuid, p_dados jsonb)
returns public.lojas
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_slug text;
  v_loja public.lojas;
begin
  if not public._plataforma_senha_ok(p_senha) then
    raise exception 'Senha incorreta';
  end if;

  v_slug := lower(trim(coalesce(p_dados->>'slug', '')));
  if v_slug <> '' and v_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' then
    raise exception 'Slug invalido: use apenas letras minusculas, numeros e hifen';
  end if;
  if v_slug <> '' and exists (select 1 from public.lojas where lower(slug) = v_slug and id <> p_id) then
    raise exception 'Ja existe uma loja com o slug "%"', v_slug;
  end if;

  update public.lojas set
    slug                    = coalesce(nullif(v_slug, ''), slug),
    nome                    = coalesce(nullif(trim(p_dados->>'nome'), ''), nome),
    status                  = coalesce(nullif(p_dados->>'status', ''), status),
    plano                   = coalesce(nullif(p_dados->>'plano', ''), plano),
    supabase_url            = coalesce(nullif(p_dados->>'supabase_url', ''), supabase_url),
    supabase_anon_key       = coalesce(nullif(p_dados->>'supabase_anon_key', ''), supabase_anon_key),
    mercado_pago_public_key = coalesce(nullif(p_dados->>'mercado_pago_public_key', ''), mercado_pago_public_key),
    whatsapp                = coalesce(nullif(p_dados->>'whatsapp', ''), whatsapp),
    pix_chave               = coalesce(nullif(p_dados->>'pix_chave', ''), pix_chave),
    painel_gestao_url       = coalesce(nullif(p_dados->>'painel_gestao_url', ''), painel_gestao_url),
    dominio_custom          = coalesce(nullif(p_dados->>'dominio_custom', ''), dominio_custom),
    tema                    = coalesce(p_dados->'tema', tema),
    atualizado_em           = now()
  where id = p_id
  returning * into v_loja;

  if v_loja is null then
    raise exception 'Loja nao encontrada';
  end if;

  return v_loja;
end;
$$;

create or replace function public.excluir_loja(p_senha text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._plataforma_senha_ok(p_senha) then
    raise exception 'Senha incorreta';
  end if;
  delete from public.lojas where id = p_id;
  return found;
end;
$$;

create or replace function public.trocar_senha_plataforma(p_senha_atual text, p_senha_nova text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._plataforma_senha_ok(p_senha_atual) then
    raise exception 'Senha atual incorreta';
  end if;
  if length(coalesce(p_senha_nova, '')) < 6 then
    raise exception 'A nova senha precisa de pelo menos 6 caracteres';
  end if;
  update public.plataforma_auth
     set senha_hash = encode(digest(p_senha_nova, 'sha256'), 'hex')
   where id = 1;
end;
$$;

-- ---------------------------------------------------------
-- Permissoes
-- ---------------------------------------------------------

grant execute on function public.resolver_loja(text)                              to anon, authenticated;
grant execute on function public.verificar_senha_plataforma(text)                 to anon, authenticated;
grant execute on function public.listar_lojas(text)                               to anon, authenticated;
grant execute on function public.criar_loja(text, jsonb)                          to anon, authenticated;
grant execute on function public.atualizar_loja(text, uuid, jsonb)                to anon, authenticated;
grant execute on function public.excluir_loja(text, uuid)                         to anon, authenticated;
grant execute on function public.trocar_senha_plataforma(text, text)              to anon, authenticated;

-- ---------------------------------------------------------
-- Exemplo de loja (opcional - apague ou ajuste)
-- ---------------------------------------------------------
-- insert into public.lojas (slug, nome, status, supabase_url, supabase_anon_key, whatsapp, pix_chave)
-- values ('saboreincasa', 'Sabore In Casa', 'ativo',
--         'https://SEU-PROJETO.supabase.co', 'SUA_ANON_KEY', '5531983391576', '31983391576');
