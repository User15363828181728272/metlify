const cfg = require("../setting");

global._ratingCount = global._ratingCount || 0;

function allowed(req) {
    const key = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    if (!key) return true;
    return key === cfg.apiKey;
}

function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST")   return res.status(405).json({ ok: false, error: "Method not allowed" });
    if (!allowed(req))           return res.status(401).json({ ok: false, error: "API key tidak valid" });

    try {
        let body = req.body || {};
        if (typeof body === "string") try { body = JSON.parse(body); } catch (_) {}

        const { name, rating, message } = body;
        if (!name)    return res.status(400).json({ ok: false, error: "Field name wajib diisi" });
        if (!rating)  return res.status(400).json({ ok: false, error: "Field rating wajib diisi" });
        if (!message) return res.status(400).json({ ok: false, error: "Field message wajib diisi" });

        const r     = Math.min(5, Math.max(1, Number(rating)));
        const stars = "⭐".repeat(r);
        const date  = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

        const text =
`━━━━━━━━━━━━━━━━━━━━
⭐  <b>RATING BARU</b>
━━━━━━━━━━━━━━━━━━━━

👤  <b>${esc(name)}</b>
${stars}  (${r}/5)

💬  <i>${esc(message)}</i>

┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
🕐  ${date}
📌  Via Soraa Deployer
━━━━━━━━━━━━━━━━━━━━`;

        const tgRes  = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: cfg.channelId, text, parse_mode: "HTML" })
        });
        const tgData = await tgRes.json();

        if (!tgData.ok) return res.status(500).json({ ok: false, error: `Telegram: ${tgData.description}` });

        global._ratingCount++;
        return res.status(200).json({ ok: true, message: "Rating berhasil dikirim ke channel Telegram" });

    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
};
