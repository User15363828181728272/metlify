const AdmZip = require("adm-zip");
const busboy = require("busboy");
const axios  = require("axios");
const cfg    = require("../setting");

global._deployCount = global._deployCount || 427;

function allowed(req) {
    const key = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    if (!key) return true;
    return key === cfg.apiKey;
}

async function getOrCreateSite(siteName) {
    const headers = {
        "Authorization": `Bearer ${cfg.netlifyToken}`,
        "Content-Type":  "application/json"
    };

    try {
        const createRes = await axios.post(
            "https://api.netlify.com/api/v1/sites",
            { name: siteName },
            { headers }
        );
        return createRes.data.id;
    } catch (e) {
        if (e.response && e.response.status === 422) {
            const listRes = await axios.get(
                "https://api.netlify.com/api/v1/sites",
                { headers, params: { filter: "all", per_page: 100, page: 1 } }
            );
            const found = listRes.data.find(s => s.name === siteName);
            if (found) return found.id;

            const listRes2 = await axios.get(
                "https://api.netlify.com/api/v1/sites",
                { headers, params: { filter: "all", per_page: 100, page: 2 } }
            );
            const found2 = listRes2.data.find(s => s.name === siteName);
            if (found2) return found2.id;

            throw new Error(`Site "${siteName}" sudah ada tapi tidak ditemukan di akun ini`);
        }
        throw e;
    }
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

        try { new AdmZip(fileBuf); }
        catch (_) { return res.status(400).json({ ok: false, error: "File ZIP tidak valid atau rusak" }); }

        const siteName = fields.domain.toLowerCase().replace(/[^a-z0-9\-]/g, "");

        let siteId;
        try {
            siteId = await getOrCreateSite(siteName);
        } catch (e) {
            const msg = e.response?.data?.message || e.response?.data?.errors?.join(", ") || e.message;
            return res.status(500).json({ ok: false, error: `Gagal setup site: ${msg}` });
        }

        let deployRes;
        try {
            deployRes = await axios.post(
                `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
                fileBuf,
                {
                    headers: {
                        "Authorization": `Bearer ${cfg.netlifyToken}`,
                        "Content-Type":  "application/zip"
                    },
                    maxContentLength: Infinity,
                    maxBodyLength:    Infinity,
                    timeout:          120000
                }
            );
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            return res.status(500).json({ ok: false, error: `Gagal deploy: ${msg}` });
        }

        const deploy  = deployRes.data;
        const url     = deploy.ssl_url || deploy.url || `https://${siteName}.netlify.app`;

        global._deployCount++;
        return res.status(200).json({
            ok:      true,
            url:     url,
            siteId:  siteId,
            message: "Deploy sukses"
        });

    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
};
