# 🍕 Delivy — App de Delivery multi-estabelecimento (SaaS)

PWA estático de delivery (pizzaria/restaurante) que agora serve **vários
estabelecimentos** a partir da mesma base de código, cada um no seu subdomínio
(ex: `pizzaria.delivy.com.br`), com identidade, cardápio, horários, frete,
cupons e Pix próprios.

O projeto nasceu para a pizzaria **Sabore In Casa** e hoje é a plataforma:
os valores dela seguem em `config.js` como padrão da "loja local".

## 🏗️ Como funciona a arquitetura

Dois Supabase (ou dois papéis):

```
                 ┌───────────────────────────────────────────┐
  cliente ──►    │  *.delivy.com.br  (mesma pasta de arquivos)│
                 │  1. tenant.js lê o subdomínio               │
                 │  2. consulta o CONTROL PLANE (resolver_loja)│
                 │  3. conecta no Supabase DAQUELA loja         │
                 └───────────────┬────────────────────────────┘
                                 │
      ┌──────────────────────────┴────────────────────────────┐
      ▼                                                        ▼
 CONTROL PLANE (1 Supabase seu)                  DATA PLANE (1 Supabase por loja)
 plataforma.sql: tabela `lojas`,                 config-loja.sql: config_loja, RPCs
 resolver_loja(), painel master                  + o sistema de gestão de cada loja
                                                 storage.sql: bucket de imagens
```

* **Control plane** = cadastro das lojas (`supabase/plataforma.sql`) + `master.html`.
* **Data plane** = o Supabase de cada estabelecimento (o que o "sistema de
  gestão" dele já usa), personalizado pelo `customizar.html`.

> Sem control plane configurado, o app continua funcionando como antes: uma
> única loja, usando o `config.js`. Isso preserva o deploy atual da Sabore.

## 🧾 Estrutura do projeto

```
plataforma.js            -> ⭐ Config da PLATAFORMA (domínio base, control plane)
tenant.js                -> Resolve a loja pelo subdomínio/?loja= e cria window.LOJA
master.html / master.js  -> 🛰️ Painel master: cadastra e gerencia estabelecimentos
config.js                -> Identidade PADRÃO da loja (template)
config-loader.js         -> Mescla config.js + cache local + Supabase e aplica tema/marca/SEO
customizar.html          -> 🎨 Painel do lojista (personaliza a loja, com upload de imagens)
customizar.js            -> Lógica do painel
supabase/plataforma.sql  -> Control plane (rode uma vez no Supabase da plataforma)
supabase/config-loja.sql -> Config da loja (rode uma vez no Supabase de cada loja)
supabase/storage.sql     -> Bucket de imagens da loja (rode uma vez por loja)
index.html / styles.css  -> App de delivery (cores e capa via variáveis CSS)
app.js                   -> Cardápio, carrinho e pedidos
integracao-sistema.js    -> Cardápio ao vivo + registro de pedidos (Supabase da loja)
pagamento-mercadopago.js -> Pix/cartão (Mercado Pago)
produtos.json            -> Reserva local de combos/snacks/bebidas
sw.js / manifest.json    -> PWA
admin.html               -> Atalhos para o painel de gestão e o customizador
imagens/                 -> Fotos, banners e ícones padrão
```

## 🚀 Como rodar local

Não precisa de Node nem build — sirva os arquivos estáticos:

```
python -m http.server 8000
```

Depois abra http://localhost:8000.

Para testar uma loja específica sem subdomínio, use `?loja=<slug>`:

```
http://localhost:8000/?loja=saboreincasa
```

## 🛰️ Passo 1 — Configurar a plataforma (control plane)

1. Crie um projeto Supabase só para a plataforma (separado do Supabase de cada
   restaurante) e rode `supabase/plataforma.sql` no SQL Editor.
2. Em `plataforma.js`, preencha:
   * `dominioBase`: ex. `delivy.com.br` (habilita `slug.delivy.com.br`);
   * `controlPlane.supabaseUrl` e `controlPlane.supabaseAnonKey` (do projeto acima).
3. Publique os arquivos num host com **domínio wildcard** (`*.delivy.com.br` →
   Vercel/Netlify/Cloudflare Pages), com SSL wildcard.

## 🏪 Passo 2 — Criar uma loja

1. Abra `master.html` (ex. `https://app.delivy.com.br/master.html`).
2. Entre com a senha master (inicial **`delivy2024`** — troque depois).
3. Clique em **+ Nova loja** e informe:
   * **slug** (vira o subdomínio, ex. `pizzariadobairro`);
   * nome, status (`trial`/`ativo`/`suspenso`), plano;
   * `Supabase URL` e `Supabase anon key` **da loja** (o data plane dela);
   * WhatsApp, chave Pix, chave pública do Mercado Pago, link do painel de gestão.

A loja já responde em `https://<slug>.delivy.com.br`.

## 🎨 Passo 3 — Personalizar a loja

No Supabase **da loja**:

1. Rode `supabase/config-loja.sql` (cria `config_loja` + funções).
2. Rode `supabase/storage.sql` (cria o bucket `loja-imagens`). Enquanto o painel
   não tiver login (Supabase Auth), descomente o bloco **ESCRITA ANÔNIMA**.
3. Abra `https://<slug>.delivy.com.br/customizar.html`, entre com a senha do
   painel (inicial **`sabore2024`** — troque em *Avançado*) e ajuste tudo:
   Marca & Contato, Tema (incl. **imagem de capa** com upload), Horários,
   Entrega, Fidelidade & Cupons, Banners (com upload), Integrações & SEO.

O que o painel salva vai para o Supabase daquela loja e vale para os clientes
na hora (com cache local por loja para funcionar mesmo offline).

## ✅ Passo 4 — Testar com dados reais (1º estabelecimento)

Rode com uma loja real e um Supabase real e valide:

- [ ] `https://<slug>.delivy.com.br` abre com a identidade correta (nome, cores, logo, capa).
- [ ] Cardápio carregando das views `v_delivery_*` da loja (e fallback se cair).
- [ ] Selecionar pizza (tamanho + borda) e bebida.
- [ ] Frete por bairro + regra de frete grátis.
- [ ] Cupom e fidelidade aplicando o **mesmo** valor mostrado e cobrado.
- [ ] Happy hour com contador.
- [ ] **Dinheiro** → pedido sincroniza (`criar_pedido_delivery`) e abre o WhatsApp no número da loja.
- [ ] **Pix** → chave do recebedor correta exibida.
- [ ] Instalar como app no celular (ícone/nome da loja).
- [ ] Abrir/usar outra loja de teste (`?loja=outra`) sem vazar cache/identidade.
- [ ] `?loja=naoexiste` mostra "Estabelecimento não encontrado".

## ⚠️ Limitações conhecidas (backlog pós-MVP)

* **Pagamento**: no MVP o fluxo é WhatsApp + Pix manual (chave do recebedor). O
  Pix/cartão automático via Mercado Pago por loja e o "split" ficam para depois —
  as *edge functions* ainda têm cupons/fidelidade próprios.
* **Login**: o painel do lojista e o master usam senha simples (sem Supabase
  Auth). Migrar para Auth + RLS por loja é a próxima fase.
* **manifest dinâmico**: desligado por padrão (`pwa.manifestDinamico`). O
  `manifest.json` é único do projeto; por loja ainda não é gerado.
* **Domínio próprio por loja**: previsto no control plane (`dominio_custom`),
  ainda não roteado.
* **Capa/SEO por loja**: a capa já é configurável; o `index.html` mantém
  placeholders que o `config-loader.js` sobrescreve em tempo de execução.
