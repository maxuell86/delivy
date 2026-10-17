// ===============================
// CONFIGURACAO DA PLATAFORMA (Delivy SaaS)
// ===============================
// Este arquivo e da PLATAFORMA (o SaaS), nao de uma loja.
// Aqui fica o "control plane": onde estao cadastradas as lojas e qual e o
// dominio base dos subdominios (ex: pizzaria.delivy.com.br).
//
// Nada aqui e secreto de verdade: a anon key do Supabase do control plane e
// publica por natureza (vai no navegador). O que NAO pode ficar aqui e a
// service_role key ou senhas de verdade - a validacao acontece no Supabase.
//
// Enquanto controlPlane estiver vazio, o app funciona como antes (uma unica
// loja, usando o config.js local) - util para rodar antes de montar a plataforma.

window.PLATAFORMA = {

    // Nome comercial do SaaS (aparece no painel master, titulos, etc.)
    nome: "Delivy",

    // Dominio base para os subdominios de cada loja.
    // Ex: "delivy.com.br" => pizzaria.delivy.com.br, lanches.delivy.com.br...
    // Deixe "" para desligar a resolucao por subdominio (usa config.js local).
    dominioBase: "",

    // Subdominios que NAO sao lojas (pertencem a propria plataforma).
    subdominiosReservados: ["www", "app", "admin", "master", "api", "painel", "delivy"],

    // Slug servido quando o acesso nao tem subdominio nem ?loja= (deixe "" para
    // usar a loja "local" definida no config.js).
    lojaPadrao: "",

    // Supabase do CONTROL PLANE (cadastro das lojas).
    // Crie um projeto Supabase so para isso e rode supabase/plataforma.sql nele.
    controlPlane: {
        supabaseUrl: "",
        supabaseAnonKey: ""
    },

    // Painel master (master.html). A senha so destrava a tela; a validacao
    // real de cada operacao (criar/editar loja) acontece no Supabase com a
    // senha cadastrada em supabase/plataforma.sql.
    master: {
        senha: ""
    }
};
