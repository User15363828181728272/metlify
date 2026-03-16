(function () {
    const sf = document.getElementById("stars");
    for (let i = 0; i < 65; i++) {
        const s  = document.createElement("div");
        s.className = "star";
        const sz = Math.random() * 2.2 + 0.4;
        s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*4.5}s;animation-delay:${-(Math.random()*6)}s`;
        sf.appendChild(s);
    }
})();

const startTime      = Date.now();
let   selectedRating = 0;

function el(id)           { return document.getElementById(id); }
function showErr(id, msg) { const e = el(id); e.textContent = msg; e.classList.add("show"); }
function clearErr(id)     { const e = el(id); e.textContent = ""; e.classList.remove("show"); }
function showLoad(id)     { el(id).classList.add("show"); }
function hideLoad(id)     { el(id).classList.remove("show"); }

function toast(msg, color) {
    const t = el("toast");
    t.textContent = msg;
    t.style.color = color || "#a78bfa";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function toggle(id) { el(id).classList.toggle("open"); }

function toggleStatus() {
    const c = el("card-status");
    c.classList.toggle("open");
    if (c.classList.contains("open")) fetchStatus();
}

function runSteps(prefix, count, ms) {
    return new Promise(resolve => {
        for (let i = 0; i < count; i++) {
            const s = el(prefix + i);
            if (s) s.className = "sitem";
        }
        if (el(prefix + "0")) el(prefix + "0").classList.add("active");
        let i = 0;
        const iv = setInterval(() => {
            const prev = el(prefix + (i - 1));
            if (prev) { prev.classList.remove("active"); prev.classList.add("done"); }
            i++;
            if (i < count) {
                const cur = el(prefix + i);
                if (cur) cur.classList.add("active");
            } else {
                const last = el(prefix + (i - 1));
                if (last) { last.classList.remove("active"); last.classList.add("done"); }
                clearInterval(iv);
                resolve();
            }
        }, ms || 950);
    });
}

setInterval(() => {
    const e = Date.now() - startTime;
    const j = Math.floor(e / 3600000);
    const m = Math.floor((e % 3600000) / 60000);
    const s = Math.floor((e % 60000) / 1000);
    const v = el("runtime-val");
    if (v) v.textContent = `${j}j ${m}m ${s}d`;
}, 1000);

async function fetchStatus() {
    try {
        const r = await fetch("/api/status");
        const d = await r.json();
        el("sv-deploy").textContent = d.deploy;
        el("sv-clone").textContent  = d.clone;
        el("sv-rating").textContent = d.rating;
        el("sv-online").textContent = "Online";
        el("sv-online").style.color = "#4ade80";
    } catch (_) {
        el("sv-online").textContent = "Offline";
        el("sv-online").style.color = "#f87171";
    }
}

async function startDeploy() {
    const domain = el("deploy-domain").value.trim();
    const file   = el("deploy-file").files[0];
    clearErr("error-deploy");
    el("result-deploy").style.display = "none";

    if (!domain)                     { showErr("error-deploy", "Subdomain wajib diisi"); return; }
    if (!file)                       { showErr("error-deploy", "Pilih file ZIP"); return; }
    if (!file.name.endsWith(".zip")) { showErr("error-deploy", "File harus .zip"); return; }

    el("btn-deploy").disabled = true;
    showLoad("loading-deploy");

    const stepProm = runSteps("sd", 4, 1200);

    const form = new FormData();
    form.append("domain", domain.toLowerCase().replace(/[^a-z0-9\-]/g, ""));
    form.append("file", file);

    try {
        const res  = await fetch("/api/deploy", { method: "POST", body: form });
        const data = await res.json();
        await stepProm;
        hideLoad("loading-deploy");
        el("btn-deploy").disabled = false;

        if (!res.ok || !data.ok) { showErr("error-deploy", data.error || "Deploy gagal"); toast("Deploy gagal", "#f87171"); return; }

        el("res-deploy-url").textContent = data.url;
        el("res-deploy-url").href        = data.url;
        el("result-deploy").style.display = "block";
        toast("Deploy sukses!", "#4ade80");
    } catch (_) {
        await stepProm;
        hideLoad("loading-deploy");
        el("btn-deploy").disabled = false;
        showErr("error-deploy", "Koneksi gagal");
        toast("Error!", "#f87171");
    }
}

async function startClone() {
    const url = el("clone-url").value.trim();
    clearErr("error-clone");
    el("result-clone").style.display = "none";

    if (!url) { showErr("error-clone", "Masukkan URL website"); return; }

    let target = url.startsWith("http") ? url : "https://" + url;
    try { new URL(target); } catch (_) { showErr("error-clone", "URL tidak valid"); return; }

    el("btn-clone").disabled = true;
    showLoad("loading-clone");

    const stepProm = runSteps("sc", 4, 1400);

    try {
        const res = await fetch("/api/clone", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ url: target })
        });

        await stepProm;
        hideLoad("loading-clone");
        el("btn-clone").disabled = false;

        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            showErr("error-clone", d.error || "Clone gagal");
            toast("Clone gagal", "#f87171");
            return;
        }

        const blob   = await res.blob();
        const domain = new URL(target).hostname;
        const objUrl = URL.createObjectURL(blob);
        el("res-clone-url").href        = objUrl;
        el("res-clone-url").download    = `${domain}.zip`;
        el("res-clone-url").textContent = `${domain}.zip — klik untuk download`;
        el("res-clone-info").textContent = `Ukuran: ${Math.round(blob.size / 1024)} KB`;
        el("result-clone").style.display = "block";
        toast("Clone selesai!", "#4ade80");
    } catch (_) {
        await stepProm;
        hideLoad("loading-clone");
        el("btn-clone").disabled = false;
        showErr("error-clone", "Koneksi gagal");
        toast("Error!", "#f87171");
    }
}

function selectRating(n) {
    selectedRating = n;
    document.querySelectorAll(".star-btn").forEach((b, i) => b.classList.toggle("active", i === n - 1));
    const sd = el("stars-display");
    sd.innerHTML = "&#9733;".repeat(n) + `<span style="opacity:.2">${"&#9733;".repeat(5 - n)}</span>`;
    sd.classList.add("lit");
}

async function submitRating() {
    const name = el("rating-name").value.trim();
    const msg  = el("feedback").value.trim();
    clearErr("error-rating");
    el("result-rating").style.display = "none";

    if (!selectedRating) { showErr("error-rating", "Pilih rating dulu"); return; }
    if (!name)           { showErr("error-rating", "Nama wajib diisi"); return; }
    if (!msg)            { showErr("error-rating", "Tulis testimoni dulu"); return; }

    el("btn-rating").disabled    = true;
    el("btn-rating").textContent = "Mengirim...";

    try {
        const res  = await fetch("/api/rating", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, rating: selectedRating, message: msg })
        });
        const data = await res.json();

        el("btn-rating").disabled    = false;
        el("btn-rating").textContent = "Kirim Rating";

        if (!res.ok || !data.ok) { showErr("error-rating", data.error || "Gagal kirim"); return; }

        el("result-rating").style.display = "block";
        el("feedback").value    = "";
        el("rating-name").value = "";
        selectedRating = 0;
        document.querySelectorAll(".star-btn").forEach(b => b.classList.remove("active"));
        el("stars-display").classList.remove("lit");
        el("stars-display").innerHTML = "&#9733;&#9733;&#9733;&#9733;&#9733;";
        toast("Rating terkirim ke Telegram!", "#4ade80");
    } catch (_) {
        el("btn-rating").disabled    = false;
        el("btn-rating").textContent = "Kirim Rating";
        showErr("error-rating", "Koneksi gagal");
    }
}
