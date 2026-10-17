// ===============================
// CONFIGURACAO DA LOJA (TEMPLATE WHITE-LABEL)
// ===============================
// Este e o UNICO arquivo de identidade do restaurante. Tudo que muda de
// loja para loja (nome, contato, endereco, horarios, tema, entrega,
// fidelidade, cupons, banners, SEO, PWA e chaves de integracao) mora aqui.
//
// O config-loader.js mescla estes valores (padrao) com o que o lojista
// salvar no painel (customizar.html -> tabela config_loja no Supabase) e
// com o ultimo config conhecido salvo no navegador (cache offline).
//
// Para um restaurante novo:
//   1. Duplique o projeto e edite este arquivo;
//   2. Substitua as imagens em /imagens;
//   3. Crie o projeto Supabase dele e rode supabase/config-loja.sql;
//   4. Preencha integracoes.supabaseUrl / supabaseAnonKey / mercadoPagoPublicKey.
//
// Nada aqui e secreto de verdade (chave anon do Supabase e chave publica do
// Mercado Pago sao publicas por natureza). A senha do painel e uma protecao
// simples contra uso casual - a validacao real acontece no Supabase.

window.CONFIG_PADRAO = {

    // ---------- Marca ----------
    marca: {
        nome: "Sabore In Casa",
        slogan: "Pizzaria Delivery",
        logo: "",
        favicon: "imagens/icons/icon-192.png",
        appleIcon: "imagens/icons/icon-512.png",
        rodape: "© Sabore In Casa",
        credito: "Desenvolvido por <b>Carlos Henrique</b>",
        tagline: "🌾 <b>Todas as nossas pizzas são feitas com massa 100% integral</b>",
        sobre: {
            titulo: "🌾 Nossa massa é 100% integral",
            paragrafos: [
                "Na Sabore In Casa, toda pizza é feita com massa 100% integral — mais fibras, mais sabor e a mesma leveza de sempre. É o que nos diferencia das outras pizzarias da região: você não abre mão do sabor pra comer melhor.",
                "Ficamos no Bairro Mantiqueira, Belo Horizonte, e entregamos em dezenas de bairros ao redor — de Venda Nova a Vespasiano, Santa Luzia, Ribeirão das Neves e Contagem."
            ]
        }
    },

    // ---------- Contato ----------
    contato: {
        whatsapp: "5531983391576",          // so digitos, com DDI (55) - destino dos pedidos
        whatsappExibicao: "(31) 98339-1576",
        telefone: "+55 31 98339-1576"       // usado no schema.org (SEO)
    },

    // ---------- Endereco ----------
    endereco: {
        rua: "Rua Maria de Lourdes da Cruz",
        numero: "378",
        bairro: "Mantiqueira",
        cidade: "Belo Horizonte",
        estado: "MG",
        cep: ""
    },

    // ---------- Horarios ----------
    // grade: chave = dia da semana (0=domingo ... 6=sabado);
    // null = fechado; {abre, fecha} em horas decimais (24 = meia-noite).
    horarios: {
        resumo: "Ter a Dom, 18h às 00h (fechado às segundas)",
        grade: {
            "0": { abre: 18, fecha: 24 },
            "1": null,
            "2": { abre: 18, fecha: 24 },
            "3": { abre: 18, fecha: 24 },
            "4": { abre: 18, fecha: 24 },
            "5": { abre: 18, fecha: 24 },
            "6": { abre: 18, fecha: 24 }
        },
        happyHour: {
            ativo: true,
            inicio: 18,          // hora de inicio (5% off automatico)
            fim: 19,             // hora de termino
            descontoPct: 5,
            texto: "Happy Hour: 5% OFF por tempo limitado!"
        }
    },

    // ---------- Tema / aparencia ----------
    tema: {
        primaria: "#ff9800",
        primariaEscura: "#e68900",
        primariaClara: "#ffcc00",       // fim dos gradientes
        gradienteInicio: "#ff6600",     // inicio dos gradientes
        preco: "#00ff88",
        whatsapp: "#25D366",
        verde: "#2ecc71",
        vermelho: "#e53935",
        fundo: "#111",
        card: "#1f1f1f",
        item: "#2a2a2a",
        capa: "imagens/capa.png",       // imagem de topo (troque pela sua / URL do Storage)
        fontes: { corpo: "Nunito", titulo: "Montserrat" },
        raio: "14px"
    },

    // ---------- Entrega / frete ----------
    entrega: {
        faixas: [
            {
                nome: "Perto",
                preco: 7,
                tempo: "20-30 min",
                bairros: ["Mantiqueira", "Juliana", "Sao Benedito", "Sao Tomas", "Serra Verde", "Jardim Vitoria", "Vila Cloris", "Jardim Da Gloria", "Nova Pampulha", "Gavea", "Celvia", "Minas Caixa", "Ceu Azul", "Rio Branco", "Venda Nova", "Parque Sao Pedro", "Lagoinha Leblon", "Jardim Dos Comerciarios", "Santa Branca"]
            },
            {
                nome: "Médio",
                preco: 10,
                tempo: "30-45 min",
                bairros: ["Justinopolis", "Floramar", "Heliopolis", "Planalto", "Itapoa", "Santa Monica", "Copacabana", "Sao Joao Batista", "Sao Bernardo", "Jardim Atlantico", "Santa Amelia", "Centro De Vespasiano", "Caieiras", "Nossa Senhora De Fatima", "Morro Alto", "Gavea II", "Jardim Leblon", "Piratininga", "Sao Jose", "Santa Isabel", "Santa Fe", "Vereda", "Florenca", "Pedra Branca", "Jardim Colonial", "Jardim Verona", "Botafogo", "Areias", "Veneza"]
            },
            {
                nome: "Longe",
                preco: 20,
                tempo: "45-60 min",
                bairros: ["Centro De Ribeirao Das Neves", "Belo Vale", "Barcelona", "Alterosa", "Bom Sossego", "Rosaneves", "Sevilha", "Contagem", "Santa Luzia", "Pampulha", "Castelo", "Ouro Preto", "Caicara", "Padre Eustachio", "Dom Bosco", "Alipio De Melo", "Guarani", "Centro De Belo Horizonte", "Lagoa Da Pampulha", "Vespasiano", "Jardim Europa"]
            }
        ],
        bairroNaoListado: { preco: 20, tempo: "45-60 min" },
        freteGratis: {
            itensComComida: 5,      // a cada N itens de comida no carrinho
            pedidosComPizza: 5,     // a cada N pedidos com pizza (contador no Supabase)
            niveis: ["diamante"]    // niveis de fidelidade com frete sempre gratis
        }
    },

    // ---------- Fidelidade ----------
    fidelidade: {
        boasVindasPct: 15,          // desconto da 1a compra (conferido no Supabase)
        pizzaGratisACada: 10,       // a cada N pizzas no historico local, ganha uma
        niveis: [                   // ordenados do menor para o maior gasto
            { id: "bronze",   nome: "Bronze",   cor: "#cd7f32", minimo: 0,    descontoPct: 0,  desc: "Gaste R$200 para virar Prata!" },
            { id: "prata",    nome: "Prata",    cor: "#c0c0c0", minimo: 200,  descontoPct: 0,  desc: "Frete gratis 1x desbloqueado!" },
            { id: "ouro",     nome: "Ouro",     cor: "#ffd700", minimo: 500,  descontoPct: 0,  desc: "10% de desconto desbloqueado!" },
            { id: "diamante", nome: "Diamante", cor: "#7df9ff", minimo: 1000, descontoPct: 15, desc: "15% off + frete sempre gratis!" }
        ]
    },

    // ---------- Cupons ----------
    // tipo: "livre" (qualquer um usa) | "nivel" (precisa de gasto minimo)
    //       | "aniversario" (so no mes/dia do aniversario cadastrado)
    // ATENCAO: os mesmos codigos/percentuais sao validados nas edge functions
    // do Supabase (Pix/cartao). Ao mudar aqui, espelhe la (ver supabase/config-loja.sql).
    cupons: [
        { codigo: "SABORE10",    desconto: 10, tipo: "nivel",       minimo: 500,  msg: "10% off - Cliente Ouro!" },
        { codigo: "SABORE15",    desconto: 15, tipo: "nivel",       minimo: 1000, msg: "15% off - Cliente Diamante!" },
        { codigo: "SABOREANIV",  desconto: 10, tipo: "aniversario", msg: "Desconto de aniversario!" },
        { codigo: "SABORECASA",  desconto: 10, tipo: "livre",       msg: "Cupom especial Sabore In Casa!" }
    ],

    // ---------- Cardapio ----------
    cardapio: {
        // Prefixo aplicado na descricao dos sabores vindos do sistema de gestao.
        // Deixe "" para nao prefixar nada.
        prefixoDescricao: "Massa 100% integral.",
        // Usados somente quando o Supabase estiver fora do ar (fallback local).
        pizzasFallback: [
            {nome:"Sabore In Casa",selo:"Pizza da Casa · Assinatura",destaque:true,desc:"Massa 100% integral. Mussarela, provolone, calabresa, bacon crocante, cebola caramelizada, catupiry e parmesão gratinado, finalizada com manjericão fresco. Nossa pizza assinatura: todos os sabores da casa em uma só.",img:"imagens/pizzas/sabore_in_casa.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"A Baiana",selo:"Picante",destaque:false,desc:"Massa 100% integral. Calabresa, ovo, pimenta, cebola.",img:"imagens/pizzas/baiana.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"À Moda da Casa",selo:"Mais completa",destaque:false,desc:"Massa 100% integral. Frango, bacon, milho, catupiry.",img:"imagens/pizzas/moda_da_casa.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Calabresa",selo:"Clássica",destaque:false,desc:"Massa 100% integral. Molho, mussarela, calabresa, cebola.",img:"imagens/pizzas/calabresa.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Frango com Catupiry",selo:"Mais pedida no Brasil",destaque:false,desc:"Massa 100% integral. Molho, frango desfiado, catupiry.",img:"imagens/pizzas/franco_com_catupiry.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Marguerita",selo:"Tradicional",destaque:false,desc:"Massa 100% integral. Mussarela, tomate, manjericão.",img:"imagens/pizzas/marguerita.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Milho com Bacon",selo:"Favorita da criançada",destaque:false,desc:"Massa 100% integral. Milho, bacon, mussarela.",img:"imagens/pizzas/milho_com_bacon.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Napolitana",selo:"Leve",destaque:false,desc:"Massa 100% integral. Mussarela, tomate, parmesão.",img:"imagens/pizzas/napolitana.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Portuguesa",selo:"Clássica",destaque:false,desc:"Massa 100% integral. Presunto, ovo, cebola, ervilha.",img:"imagens/pizzas/portuguesa.webp",precoP:39.90,precoM:56.90,precoG:75.90},
            {nome:"Quatro Queijos",selo:"Para quem ama queijo",destaque:false,desc:"Massa 100% integral. Mussarela, provolone, parmesão, catupiry.",img:"imagens/pizzas/quatro_queijos.webp",precoP:39.90,precoM:56.90,precoG:75.90}
        ],
        descricoesFallback: {
            "Sabore In Casa": "Mussarela, provolone, calabresa, bacon crocante, cebola caramelizada, catupiry e parmesão gratinado, finalizada com manjericão fresco. Nossa pizza assinatura: todos os sabores da casa em uma só.",
            "Calabresa": "Molho, mussarela, calabresa, cebola.",
            "Frango com Catupiry": "Molho, frango desfiado, catupiry.",
            "Quatro Queijos": "Mussarela, provolone, parmesão, catupiry.",
            "4 Queijos": "Mussarela, provolone, parmesão, catupiry.",
            "Portuguesa": "Presunto, ovo, cebola, ervilha.",
            "Marguerita": "Mussarela, tomate, manjericão.",
            "Baiana": "Calabresa, ovo, pimenta, cebola.",
            "A Baiana": "Calabresa, ovo, pimenta, cebola.",
            "Napolitana": "Mussarela, tomate, parmesão.",
            "Milho com Bacon": "Milho, bacon, mussarela.",
            "Moda da Casa": "Frango, bacon, milho, catupiry.",
            "À Moda da Casa": "Frango, bacon, milho, catupiry."
        }
    },

    // ---------- Pedido (tamanhos, bordas, pagamentos) ----------
    pedido: {
        // campo = coluna de preco na view do sistema de gestao (v_delivery_pizzas)
        tamanhos: [
            { id: "P", rotulo: "Pequena", cm: "25cm", campo: "precoP" },
            { id: "M", rotulo: "Média",   cm: "30cm", campo: "precoM" },
            { id: "G", rotulo: "Gigante", cm: "35cm", campo: "precoG" }
        ],
        bordas: [
            { nome: "Normal",  preco: 0 },
            { nome: "Catupiry", preco: 10 },
            { nome: "Cheddar",  preco: 10 }
        ],
        pagamentos: [
            { valor: "PIX",      nome: "Pix",      icone: "💠" },
            { valor: "Dinheiro", nome: "Dinheiro", icone: "💵" },
            { valor: "Cartão",   nome: "Cartão",   icone: "💳" }
        ]
    },

    // ---------- Banners (carrossel do topo) ----------
    banners: [
        { nome: "Combo Familia", preco: 149.90, foto: "imagens/banners/combo-familia.webp", toast: "perfeito pra dividir!" },
        { nome: "Combo Amigos",  preco: 169.90, foto: "imagens/banners/combo-amigos.webp",  toast: "partiu resenha!" },
        { nome: "Combo Casal",   preco: 72.90,  foto: "imagens/banners/combo-casal.webp",   toast: "clima perfeito!" }
    ],

    // ---------- SEO ----------
    seo: {
        baseUrl: "https://saboreincasa.github.io/app-delivery-sabore-in-casa/",
        titulo: "Sabore In Casa — Pizzaria Delivery em Belo Horizonte (Mantiqueira)",
        descricao: "Pizza de massa 100% integral em Belo Horizonte — cardápio de pizzas, bebidas e combos com entrega no Bairro Mantiqueira e região. Pedido rápido direto pelo WhatsApp.",
        ogImage: "imagens/capa.png",
        tipo: "Restaurant",
        culinaria: "Pizza",
        faixaPreco: "R$32 - R$170",
        areaAtendida: ["Belo Horizonte", "Vespasiano", "Ribeirão das Neves", "Santa Luzia", "Contagem"]
    },

    // ---------- PWA (instalacao como app) ----------
    pwa: {
        nome: "Sabore In Casa",
        shortName: "Sabore",
        descricao: "Peça pizza online em Belo Horizonte com entrega rápida — cardápio, carrinho e pedido direto pelo WhatsApp.",
        themeColor: "#d32f2f",
        backgroundColor: "#111",
        icons: [
            { src: "imagens/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "imagens/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ],
        // true = gera o manifest a partir desta config (blob) em tempo de execucao;
        // false = usa o manifest.json estatico do projeto.
        manifestDinamico: false
    },

    // ---------- Integracoes ----------
    integracoes: {
        supabaseUrl: "https://hzkmhtfwulxvysorvcjb.supabase.co",
        supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6a21odGZ3dWx4dnlzb3J2Y2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTk2MDksImV4cCI6MjEwMjI3NTYwOX0.TgB3ePpPMCHTvHiK56pZFAY--YPw625HidVRnHaFfZ4",
        mercadoPagoPublicKey: "APP_USR-d1f0aba4-832f-42d4-8075-e65e4fdf5bb9",
        pixChave: "31983391576",
        painelGestaoUrl: "https://saboreincasa.github.io/sabore-in-casa-sistema/"
    },

    // ---------- Painel de customizacao (customizar.html) ----------
    painel: {
        // Protecao simples contra uso casual. A senha que vale para SALVAR no
        // Supabase e a cadastrada em supabase/config-loja.sql (hash no banco).
        senha: "sabore2024"
    }
}
