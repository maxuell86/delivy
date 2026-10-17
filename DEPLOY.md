# 🚀 Guia de Produção — Delivy SaaS (continuar daqui)

> **Status:** o MVP multi-estabelecimento já está implementado e testado no
> código. Falta a parte de infraestrutura (criar os Supabase, publicar com
> subdomínio) e o onboarding da 1ª loja real.
>
> **Última mudança:** commit `2d2ecfe` — "MVP SaaS multi-estabelecimento:
> control plane, tenant, painel master e customização por loja".

---

## ✅ O que já está pronto (código)

- Resolução de loja por **subdomínio** (`slug.delivy.com.br`) ou `?loja=<slug>`.
- **Control plane** (`supabase/plataforma.sql`) + **painel master** (`master.html`).
- App conecta no **Supabase de cada loja** automaticamente.
- Cache e personalização **escopados por loja** (sem vazar entre estabelecimentos).
- **Capa** e **banners** com upload para o Supabase Storage.
- Compatível: **sem control plane configurado, funciona como antes** (loja única do `config.js`).
- Testes: sintaxe OK, páginas servindo 200, resolução de tenant validada em 6 cenários.

---

## 🧭 Passo a passo (retomar amanhã, nesta ordem)

### Etapa A — Criar o Supabase da PLATAFORMA (control plane)
1. Crie um projeto novo no Supabase — **só para a plataforma** (separado do Supabase de cada restaurante).
2. Abra **SQL Editor** e rode o arquivo `supabase/plataforma.sql` inteiro.
3. Anote: **Project URL** e **anon public key** (Settings → API).

> Senha inicial do painel master: **`delivy2024`** (troque depois).

### Etapa B — Configurar `plataforma.js`
Abra `plataforma.js` e preencha:
```js
dominioBase: "delivy.com.br",          // troque pelo SEU domínio
controlPlane: {
    supabaseUrl: "https://SEU-PROJETO.supabase.co",
    supabaseAnonKey: "SUA_ANON_KEY"
},
master: { senha: "" }                   // deixe vazio: a senha vale pelo Supabase
```

### Etapa C — Publicar com domínio wildcard
Escolha um host e aponte **`*.delivy.com.br`** para o projeto (SSL wildcard automático):

- **Cloudflare Pages:** cria o projeto, faz o upload/push da pasta, adiciona o domínio
  custom `*.delivy.com.br`.
- **Vercel:** `vercel` no diretório (site estático), depois Project → Domains → adiciona
  `*.delivy.com.br` + `delivy.com.br`.
- **Netlify:** deploy manual da pasta, Domain settings → adiciona `*.delivy.com.br`.

> Alternativa sem wildcard (para testar): use `delivy.com.br/l/...`? Não — o código
> usa **subdomínio**. Para teste rápido, publique normal e acesse com `?loja=<slug>`.

### Etapa D — Abrir o painel master e criar a 1ª loja
1. Acesse `https://app.delivy.com.br/master.html` (ou o domínio publicado + `/master.html`).
2. Entre com `delivy2024`.
3. **+ Nova loja** e informe:
   - **Slug** (vira o subdomínio, ex. `saboreincasa`) — só minúsculas, números e hífen.
   - **Nome**, status (**`ativo`**), plano.
   - **Supabase URL** e **Supabase anon key** da loja (o banco dela).
   - WhatsApp, chave Pix, chave pública do Mercado Pago, link do painel de gestão.

### Etapa E — Preparar o Supabase da LOJA
No SQL Editor do Supabase **da loja**, rode:
1. `supabase/config-loja.sql` (cria `config_loja` + funções). Senha inicial do painel: **`sabore2024`**.
2. `supabase/storage.sql` (cria o bucket `loja-imagens`).
   - **Importante:** enquanto não houver login, **descomente o bloco "ESCRITA ANÔNIMA"**
     no fim do arquivo, senão o upload de imagens falha.
3. Confirme que as views/RPCs do sistema de gestão existem nesse projeto:
   `v_delivery_pizzas`, `v_delivery_bebidas`, `v_delivery_lanches`, `v_delivery_combos`,
   `v_pedido_status`, `criar_pedido_delivery`, `cadastrar_lead_delivery`, `cliente_*`.

### Etapa F — Personalizar a loja
1. Acesse `https://saboreincasa.delivy.com.br/customizar.html`.
2. Entre com `sabore2024` e ajuste: **Marca & Contato**, **Tema** (incl. **imagem de capa**),
   **Horários**, **Entrega**, **Fidelidade & Cupons**, **Banners** (com upload), **Integrações & SEO**.
3. Clique em **Salvar e publicar**.
4. Em **Avançado**, troque a senha do painel.

### Etapa G — Teste ponta a ponta com dados reais
- [ ] `https://saboreincasa.delivy.com.br` abre com identidade correta (nome, cores, logo, capa).
- [ ] Cardápio carrega do Supabase da loja (e o fallback local se o Supabase cair).
- [ ] Selecionar pizza (tamanho + borda) e bebida.
- [ ] Frete por bairro + regra de frete grátis.
- [ ] Cupom e fidelidade aplicando o **mesmo** valor mostrado e cobrado.
- [ ] Happy hour com contador.
- [ ] **Dinheiro** → pedido sincroniza (`criar_pedido_delivery`) e abre o WhatsApp no número certo.
- [ ] **Pix** → chave do recebedor correta exibida.
- [ ] Instalar como app no celular (ícone/nome).
- [ ] Abrir `https://outraloja.delivy.com.br` (loja de teste) → identidade totalmente diferente.
- [ ] Abrir `https://naoexiste.delivy.com.br` → mostra "Estabelecimento não encontrado".

---

## ⚠️ Senhas e segredos (não esquecer)

| O quê | Onde | Padrão | Trocar em |
|---|---|---|---|
| Painel master | Supabase da plataforma | `delivy2024` | `master.html`? ainda não tem tela — trocar por SQL/RPC |
| Painel do lojista | Supabase da loja | `sabore2024` | `customizar.html` → Avançado |
| Supabase anon keys | `plataforma.js` / `config.js` | públicas | — |

> Segredos reais (service_role, access token do Mercado Pago) **nunca** vão no front.

---

## 🧱 Backlog (próximas fases, fora do MVP)

1. **Login real (Supabase Auth)** por lojista + RLS por loja — substitui as senhas simples.
2. **Pagamento por loja**: Mercado Pago com token de cada loja (ou split/marketplace).
   Hoje o MVP é **WhatsApp + Pix manual (chave do recebedor)**.
3. **manifest.json dinâmico por loja** (nome/ícone/cor). Hoje é único do projeto.
4. **Domínio próprio por loja** (campo `dominio_custom` já existe no control plane).
5. **Impressão de comanda** (térmica 80mm), se a loja real precisar.
6. Unificar funções duplicadas (`mergeProfundo`, cache, `gerarManifest`) num módulo comum.

---

## 🆘 Solução de problemas

- **"Control plane não configurado"** no `master.html` → preencha `plataforma.js > controlPlane` e recarregue.
- **Upload de imagem dá erro de RLS** → descomente o bloco "ESCRITA ANÔNIMA" em `supabase/storage.sql`.
- **"Tabela config_loja não encontrada"** no `customizar.html` → rode `supabase/config-loja.sql` no Supabase da loja.
- **Loja não aparece / "não encontrada"** → confira o `slug` no painel master e se o `status` está `ativo`/`trial`.
- **Cupom mostrado ≠ cobrado** no Pix/cartão automático → as *edge functions* ainda têm os valores
  antigos (ver fim de `supabase/config-loja.sql`). No MVP isso não afeta porque o pagamento é manual.

---

## 🗂️ Mapa dos arquivos novos/alterados neste MVP

```
plataforma.js            (novo)  config da plataforma / control plane
tenant.js                (novo)  resolve a loja pelo subdomínio
master.html / master.js  (novos) painel master (criar/editar lojas)
supabase/plataforma.sql  (novo)  control plane (rodar no Supabase da plataforma)
supabase/storage.sql     (novo)  bucket de imagens (rodar em cada loja)
integracao-sistema.js    (alt.)  conecta no Supabase da loja
config-loader.js         (alt.)  cache por loja + variável --capa
customizar.js            (alt.)  Supabase da loja + upload de imagens
customizar.html          (alt.)  carrega plataforma/tenant
index.html / admin.html  (alt.)  carrega plataforma/tenant; textos neutros
styles.css               (alt.)  capa configurável
config.js                (alt.)  chave tema.capa
README.md / DEPLOY.md    (novos) documentação
```
