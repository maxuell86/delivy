// =============================================================
// PAINEL MASTER DA PLATAFORMA (master.html)
// =============================================================
// Cadastra e gerencia os estabelecimentos (control plane).
//   - conecta no Supabase definido em plataforma.js > controlPlane
//   - "Entrar" confere a senha master (local ou via RPC no Supabase)
//   - listar / criar / editar / excluir lojas pelos RPCs de supabase/plataforma.sql
//
// A senha so destrava a tela; toda gravacao e validada no servidor.

const P = window.PLATAFORMA || {}
const CP = P.controlPlane || {}
const el = id => document.getElementById(id)
let cli = null
let senhaMaster = ""
let lojas = []

function esc(s){
    return String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
function status(msg, tipo){
    const b = el("statusBar")
    if(!b) return
    b.className = "status" + (tipo ? " " + tipo : "")
    b.innerHTML = msg
}
function msgGate(msg){ el("gateMsg").innerText = msg || "" }

// ---------- Conexao ----------
function conectar(){
    if(typeof window.supabase === "undefined" || !CP.supabaseUrl || !CP.supabaseAnonKey) return null
    return window.supabase.createClient(CP.supabaseUrl, CP.supabaseAnonKey)
}

// ---------- Entrada ----------
async function entrarMaster(){
    const senha = el("gateSenha").value
    if(!senha){ msgGate("Digite a senha master"); return }

    if(P.master && P.master.senha && senha === P.master.senha){ liberar(senha); return }

    if(cli){
        try{
            const { data, error } = await cli.rpc("verificar_senha_plataforma", { p_senha: senha })
            if(!error && data === true){ liberar(senha); return }
        }catch(e){ /* cai no erro */ }
    }
    msgGate("Senha incorreta")
}

function liberar(senha){
    senhaMaster = senha
    el("gate").style.display = "none"
    el("painel").style.display = "block"
    document.title = (P.nome || "Plataforma") + " — Painel Master"
    el("tituloMaster").innerHTML = "🛰️ " + esc(P.nome || "Plataforma") + " · Painel Master"
    el("gateTitulo").innerText = "Painel Master"
    recarregar()
}

// ---------- Listagem ----------
async function recarregar(){
    if(!cli){
        status("⚠️ Control plane não configurado. Preencha <b>plataforma.js &gt; controlPlane</b> e rode <b>supabase/plataforma.sql</b>.", "aviso")
        el("listaLojas").innerHTML = ""
        return
    }
    status("Carregando lojas...")
    try{
        const { data, error } = await cli.rpc("listar_lojas", { p_senha: senhaMaster })
        if(error) throw error
        lojas = Array.isArray(data) ? data : []
        renderLista()
        status("✓ " + lojas.length + " loja(s).", "ok")
    }catch(e){
        status("Erro ao listar: " + (e?.message || e), "erro")
    }
}

function renderLista(){
    if(!lojas.length){
        el("listaLojas").innerHTML = '<div class="vazio">Nenhuma loja cadastrada. Clique em <b>+ Nova loja</b>.</div>'
        return
    }
    el("listaLojas").innerHTML = lojas.map(l => `
    <div class="loja">
        <div class="info">
            <b>${esc(l.nome)}
                <span class="selo ${esc(l.status)}">${esc(l.status)}</span>
            </b>
            <span>/${esc(l.slug)} &nbsp;·&nbsp; plano: ${esc(l.plano || "-")}</span>
            <span>${l.supabase_url ? "Supabase: " + esc(l.supabase_url) : "⚠️ sem Supabase"}</span>
        </div>
        <div class="botoes">
            <button onclick="abrirLoja('${l.id}')">✏️ Editar</button>
            <button class="perigo" onclick="removerLoja('${l.id}')">🗑️ Excluir</button>
        </div>
    </div>`).join("")
}

// ---------- Formulario ----------
function novoForm(){
    el("formTitulo").innerText = "Nova loja"
    el("lId").value = ""
    ;["lSlug","lNome","lPlano","lWhatsapp","lPix","lSupabaseUrl","lSupabaseAnon","lMp","lPainelGestao"].forEach(id => el(id).value = "")
    el("lStatus").value = "trial"
    el("formBox").style.display = "block"
    el("lSlug").focus()
}

function abrirLoja(id){
    const l = lojas.find(x => x.id === id)
    if(!l) return
    el("formTitulo").innerText = "Editar loja"
    el("lId").value = l.id
    el("lSlug").value = l.slug || ""
    el("lNome").value = l.nome || ""
    el("lStatus").value = l.status || "trial"
    el("lPlano").value = l.plano || ""
    el("lWhatsapp").value = l.whatsapp || ""
    el("lPix").value = l.pix_chave || ""
    el("lSupabaseUrl").value = l.supabase_url || ""
    el("lSupabaseAnon").value = l.supabase_anon_key || ""
    el("lMp").value = l.mercado_pago_public_key || ""
    el("lPainelGestao").value = l.painel_gestao_url || ""
    el("formBox").style.display = "block"
    el("formBox").scrollIntoView({ behavior: "smooth" })
}

function fecharForm(){
    el("formBox").style.display = "none"
}

function dadosForm(){
    return {
        slug: el("lSlug").value.trim().toLowerCase(),
        nome: el("lNome").value.trim(),
        status: el("lStatus").value,
        plano: el("lPlano").value.trim(),
        whatsapp: el("lWhatsapp").value.trim(),
        pix_chave: el("lPix").value.trim(),
        supabase_url: el("lSupabaseUrl").value.trim(),
        supabase_anon_key: el("lSupabaseAnon").value.trim(),
        mercado_pago_public_key: el("lMp").value.trim(),
        painel_gestao_url: el("lPainelGestao").value.trim()
    }
}

async function salvarLoja(){
    if(!cli){ status("Control plane não configurado.", "erro"); return }
    const dados = dadosForm()
    if(!dados.slug){ status("Informe o slug da loja.", "erro"); return }
    const id = el("lId").value
    status("Salvando loja...")
    try{
        const { error } = id
            ? await cli.rpc("atualizar_loja", { p_senha: senhaMaster, p_id: id, p_dados: dados })
            : await cli.rpc("criar_loja", { p_senha: senhaMaster, p_dados: dados })
        if(error) throw error
        fecharForm()
        await recarregar()
        status("✓ Loja salva.", "ok")
    }catch(e){
        status("Erro ao salvar: " + (e?.message || e), "erro")
    }
}

async function removerLoja(id){
    const l = lojas.find(x => x.id === id)
    if(!confirm("Excluir a loja \"" + (l?.nome || "") + "\"? Essa ação não pode ser desfeita.")) return
    try{
        const { error } = await cli.rpc("excluir_loja", { p_senha: senhaMaster, p_id: id })
        if(error) throw error
        await recarregar()
        status("✓ Loja excluída.", "ok")
    }catch(e){
        status("Erro ao excluir: " + (e?.message || e), "erro")
    }
}

// ---------- Boot ----------
(function(){
    cli = conectar()
    const p = el("gateTitulo")
    if(p) p.innerText = (P.nome || "Plataforma") + " · Painel Master"
    if(!cli){
        msgGate("Control plane não configurado em plataforma.js (controlPlane).")
    }
})()
