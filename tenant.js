// ===============================
// TENANT (qual estabelecimento esta sendo servido)
// ===============================
// Descobre a loja pelo endereco e cria a partir daqui a "identidade" da
// sessao, que o resto do app usa:
//
//   window.LOJA_SLUG : slug da loja (sincrono, sempre definido - "" = local)
//   window.LOJA      : dados da loja (contrato: slug, nome, status,
//                      supabase_url, supabase_anon_key, whatsapp, pix_chave)
//   window.tenantPronto : Promise que resolve quando a loja ja foi resolvida
//
// Ordem de resolucao do slug:
//   1) ?loja=<slug> na URL            (util no desenvolvimento local)
//   2) subdominio <slug>.<dominioBase> (so quando PLATAFORMA.dominioBase existe)
//   3) PLATAFORMA.lojaPadrao
//   4) ""  -> loja "local" (config.js), comportamento antigo preservado
//
// Se a loja estiver suspensa ou nao existir, a pagina e bloqueada com um aviso
// amigavel. Se o control plane nao estiver configurado, nada disso acontece:
// o app segue exatamente como antes, usando o config.js.

(function () {
    const P = window.PLATAFORMA || {};
    const BASE = String(P.dominioBase || "").toLowerCase().replace(/^\.+|\.+$/g, "");
    const RESERVADOS = (P.subdominiosReservados || []).map(s => String(s).toLowerCase());

    // ---------- Descobrir o slug pela URL ----------
    function slugDoEndereco() {
        try {
            const q = (new URLSearchParams(location.search).get("loja") || "").trim().toLowerCase();
            if (q) return q;
        } catch (e) { /* URLSearchParams indisponivel: segue */ }

        const host = String(location.hostname || "").toLowerCase();
        if (BASE && host.endsWith("." + BASE)) {
            const sub = host.slice(0, host.length - BASE.length - 1);
            if (sub && !sub.includes(".") && !RESERVADOS.includes(sub)) return sub;
        }
        return "";
    }

    const slug = slugDoEndereco() || String(P.lojaPadrao || "").trim().toLowerCase();
    window.LOJA_SLUG = slug;
    window.LOJA = null;

    // ---------- Carregar o SDK do Supabase sob demanda ----------
    function carregarSupabase() {
        if (typeof window.supabase !== "undefined") return Promise.resolve();
        if (window.__supabaseCarregando) return window.__supabaseCarregando;
        window.__supabaseCarregando = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3";
            s.integrity = "sha384-l8ah+VgaWtk1mvOe9VC+OirC6qHFF4yH7l7mKRidV9MSti3E9F463bMp6ZVN4kuC";
            s.crossOrigin = "anonymous";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Falha ao carregar o SDK do Supabase"));
            document.head.appendChild(s);
        });
        return window.__supabaseCarregando;
    }

    const cp = P.controlPlane || {};
    const temControlPlane = !!(cp.supabaseUrl && cp.supabaseAnonKey);

    // ---------- Resolver a loja ----------
    async function resolver() {
        // Sem slug: loja local (config.js), como sempre foi.
        if (!slug) { window.LOJA = null; return null; }

        // Com slug mas sem control plane: modo local/teste (usa config.js,
        // mas mantem o slug para escopar cache e links).
        if (!temControlPlane) {
            window.LOJA = { slug, nome: slug, status: "local" };
            return window.LOJA;
        }

        try {
            await carregarSupabase();
            const cli = window.supabase.createClient(cp.supabaseUrl, cp.supabaseAnonKey);
            const { data, error } = await cli.rpc("resolver_loja", { p_slug: slug });
            if (error) throw error;

            const loja = Array.isArray(data) ? data[0] : data;
            if (!loja) {
                window.LOJA = { slug, nome: slug, status: "nao_encontrada" };
                return window.LOJA;
            }
            window.LOJA = {
                slug: loja.slug || slug,
                nome: loja.nome || slug,
                status: loja.status || "ativo",
                supabase_url: loja.supabase_url || "",
                supabase_anon_key: loja.supabase_anon_key || "",
                whatsapp: loja.whatsapp || "",
                pix_chave: loja.pix_chave || ""
            };
            return window.LOJA;
        } catch (e) {
            console.warn("[tenant] Nao foi possivel resolver a loja:", e);
            window.LOJA = { slug, nome: slug, status: "erro" };
            return window.LOJA;
        }
    }

    window.tenantPronto = resolver();

    // A loja pode ser usada pelo app? (local/trial/ativo = sim)
    window.tenantAtivo = function () {
        const l = window.LOJA;
        if (!l) return true;
        return ["ativo", "trial", "local"].includes(l.status);
    };

    // ---------- Bloqueio amigavel (loja nao encontrada / suspensa) ----------
    function bloquear(titulo, texto) {
        function montar() {
            if (document.getElementById("tenantBloqueio")) return;
            const d = document.createElement("div");
            d.id = "tenantBloqueio";
            d.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
                "background:#111;color:#fff;font-family:Nunito,Arial,sans-serif;text-align:center;padding:24px;";
            d.innerHTML = '<div>' +
                '<div style="font-size:46px">🍕</div>' +
                '<h1 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:12px 0">' + titulo + '</h1>' +
                '<p style="color:#aaa;max-width:380px;line-height:1.5">' + texto + '</p>' +
                '</div>';
            document.body.appendChild(d);
        }
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
        else montar();
    }

    window.tenantPronto.then(l => {
        if (!l) return;
        if (l.status === "nao_encontrada") bloquear("Estabelecimento não encontrado", "Confira o endereço informado e tente novamente.");
        else if (l.status === "suspenso") bloquear("Estabelecimento indisponível", "Esta loja está temporariamente fora do ar.");
    });
})();
