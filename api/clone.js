const axios   = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");
const path    = require("path");
const AdmZip  = require("adm-zip");
const cfg     = require("../setting");

global._cloneCount = global._cloneCount || 0;

function allowed(req) {
    const key = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    if (!key) return true;
    return key === cfg.apiKey;
}

async function crawl(url, domain, fileMap, visited) {
    if (visited.has(url) || visited.size >= 100) return;
    visited.add(url);
    try {
        const { data, headers } = await axios.get(url, {
            timeout: 7000,
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" },
            maxRedirects: 5
        });
        const parsed = new URL(url);
        let file = parsed.pathname === "/" ? "index.html" : parsed.pathname.replace(/^\//, "");
        if (!path.extname(file)) file += ".html";
        fileMap[file] = Buffer.from(data);
        if ((headers["content-type"] || "").includes("text/html")) {
            const $ = cheerio.load(data.toString());
            const links = new Set();
            $("[href],[src]").each((_, el) => {
                const v = $(el).attr("href") || $(el).attr("src");
                if (!v) return;
                try {
                    const abs = new URL(v, url).href;
                    if (new URL(abs).hostname === domain) links.add(abs);
                } catch (_) {}
            });
            for (const l of links) await crawl(l, domain, fileMap, visited);
        }
    } catch (_) {}
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

        const { url } = body;
        if (!url) return res.status(400).json({ ok: false, error: "Field url wajib diisi" });

        let target;
        try { target = new URL(url.startsWith("http") ? url : "https://" + url); }
        catch (_) { return res.status(400).json({ ok: false, error: "URL tidak valid" }); }

        const domain  = target.hostname;
        const fileMap = {};
        await crawl(target.href, domain, fileMap, new Set());

        if (!Object.keys(fileMap).length)
            return res.status(500).json({ ok: false, error: "Tidak ada file yang berhasil di-crawl" });

        const zip    = new AdmZip();
        for (const [p, buf] of Object.entries(fileMap)) zip.addFile(p, buf);
        const zipBuf = zip.toBuffer();

        global._cloneCount++;
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${domain}.zip"`);
        res.setHeader("Content-Length", zipBuf.length);
        res.setHeader("X-File-Count", Object.keys(fileMap).length);
        return res.status(200).send(zipBuf);

    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
};
