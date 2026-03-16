const AdmZip = require("adm-zip");
const busboy = require("busboy");
const axios  = require("axios");
const cfg    = require("../setting");

global._deployCount = global._deployCount || 0;

function allowed(req) {
    const key = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    if (!key) return true;
    return key === cfg.apiKey;
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST")   return res.status(405).json({ ok: false, error: "Method not allowed" });
    if (!allowed(req))           return res.status(401).json({ ok: false, error: "API key tidak valid" });

    try {
        const bb     = busboy({ headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } });
        const fields = {};
        let fileBuf  = null;

        await new Promise((resolve, reject) => {
            bb.on("field", (k, v) => { fields[k] = v; });
            bb.on("file",  (_k, stream) => {
                const chunks = [];
                stream.on("data", d => chunks.push(d));
                stream.on("end",  () => { fileBuf = Buffer.concat(chunks); });
            });
            bb.on("close", resolve);
            bb.on("error", reject);
            req.pipe(bb);
        });

        if (!fields.domain) return res.status(400).json({ ok: false, error: "Field domain wajib diisi" });
        if (!fileBuf)       return res.status(400).json({ ok: false, error: "File ZIP tidak ditemukan" });

        const siteName = fields.domain.toLowerCase().replace(/[^a-z0-9\-]/g, "");

        new AdmZip(fileBuf);

        const siteRes = await axios.post(
            "https://api.netlify.com/api/v1/sites",
            { name: siteName },
            {
                headers: {
                    "Authorization": `Bearer ${cfg.netlifyToken}`,
                    "Content-Type":  "application/json"
                }
            }
        ).catch(async () => {
            const list = await axios.get("https://api.netlify.com/api/v1/sites", {
                headers: { "Authorization": `Bearer ${cfg.netlifyToken}` },
                params: { name: siteName }
            });
            const existing = list.data.find(s => s.name === siteName);
            if (existing) return { data: existing };
            throw new Error("Gagal membuat atau menemukan site");
        });

        const siteId = siteRes.data.id;

        const deployRes = await axios.post(
            `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
            fileBuf,
            {
                headers: {
                    "Authorization":  `Bearer ${cfg.netlifyToken}`,
                    "Content-Type":   "application/zip",
                },
                maxContentLength: Infinity,
                maxBodyLength:    Infinity,
                timeout:          120000,
            }
        );

        const deploy  = deployRes.data;
        const siteUrl = `https://${siteName}.netlify.app`;

        global._deployCount++;
        return res.status(200).json({
            ok:       true,
            url:      siteUrl,
            siteId:   siteId,
            deployId: deploy.id,
            message:  "Deploy sukses"
        });

    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data || e.message;
        return res.status(500).json({ ok: false, error: String(msg).slice(0, 300) });
    }
};
