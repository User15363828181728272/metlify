const sf=document.getElementById('stars');
for(let i=0;i<80;i++){
  const s=document.createElement('div');s.className='star';
  const z=Math.random()*2.4+.3;
  s.style.cssText=`width:${z}px;height:${z}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${1.5+Math.random()*5}s;animation-delay:${-(Math.random()*7)}s`;
  sf.appendChild(s);
}

function toggleDrawer(){
  const open=document.getElementById('drawer').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show',open);
  document.getElementById('ham').classList.toggle('open',open);
  document.getElementById('ham-ico').className=open?'fas fa-xmark':'fas fa-bars';
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('ham').classList.remove('open');
  document.getElementById('ham-ico').className='fas fa-bars';
}

const pages=['home','deploy','clone','status'];
function goPage(id){
  pages.forEach(p=>{
    document.getElementById('pg-'+p).classList.toggle('active',p===id);
    document.getElementById('bn-'+p).classList.toggle('active',p===id);
  });
  document.querySelectorAll('.dr-item').forEach((el,i)=>{
    el.classList.toggle('active',i===pages.indexOf(id));
  });
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='status')fetchStatus();
}

const startT=Date.now();
function updateClock(){
  const now=new Date();
  document.getElementById('clk').textContent=now.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  document.getElementById('clkd').textContent=now.toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const e=Date.now()-startT,j=Math.floor(e/3600000),m=Math.floor((e%3600000)/60000),s=Math.floor((e%60000)/1000);
  const rt=document.getElementById('st-rt');if(rt)rt.textContent=`${j}j ${m}m ${s}d`;
}
updateClock();setInterval(updateClock,1000);

async function loadWeather(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.2575&longitude=112.7521&current_weather=true&timezone=Asia%2FJakarta');
    const d=await r.json();const cw=d.current_weather;const wc=cw.weathercode;
    let ico='fa-cloud-rain',col='#60a5fa',desc='Hujan';
    if(wc===0){ico='fa-sun';col='#fbbf24';desc='Cerah'}
    else if(wc<=2){ico='fa-cloud-sun';col='#fbbf24';desc='Sebagian berawan'}
    else if(wc<=3){ico='fa-cloud';col='#9896b8';desc='Mendung'}
    else if(wc<=49){ico='fa-smog';col='#8b8aa8';desc='Berkabut'}
    else if(wc<=69){ico='fa-cloud-rain';col='#60a5fa';desc='Hujan'}
    else if(wc<=82){ico='fa-cloud-showers-heavy';col='#60a5fa';desc='Hujan deras'}
    else if(wc<=99){ico='fa-cloud-bolt';col='#fbbf24';desc='Badai petir'}
    document.getElementById('wx-ico').innerHTML=`<i class="fas ${ico}" style="color:${col};font-size:28px"></i>`;
    document.getElementById('wx-temp-area').innerHTML=`<div class="wx-temp">${Math.round(cw.temperature)}°C</div>`;
    const de=document.getElementById('wx-desc');
    de.innerHTML=`${desc} <i class="fas fa-wind" style="font-size:9px;margin:0 2px"></i>${Math.round(cw.windspeed)} km/h`;
    de.style.display='block';
  }catch{document.getElementById('wx-temp-area').innerHTML='<span class="wx-loading">Gagal memuat</span>';}
}
loadWeather();

const faqs=[
  {q:'Apa itu Soraa Deployment?',a:'Soraa Deployment adalah tools gratis untuk deploy website statik ke Netlify, serta clone source code dari website manapun. Upload ZIP — dalam detik website kamu langsung live.'},
  {q:'Apakah benar-benar gratis?',a:'Ya, 100% gratis untuk penggunaan personal. Tidak ada biaya tersembunyi, tidak perlu kartu kredit.'},
  {q:'Format file apa yang didukung?',a:'Hanya file .zip berisi website statik (HTML, CSS, JS, gambar). Pastikan file index.html ada di root folder ZIP.'},
  {q:'Berapa lama proses deploy?',a:'Biasanya 10–30 detik, tergantung ukuran file dan kecepatan internet. Setelah selesai URL langsung aktif.'},
  {q:'Berapa batas ukuran file?',a:'Maksimal 50MB per file ZIP. Untuk website lebih besar, optimalkan aset terlebih dahulu.'},
  {q:'Bagaimana fitur Clone Web bekerja?',a:'Masukkan URL target, sistem akan crawl dan mengunduh semua file lalu mengemasnya dalam ZIP yang bisa kamu download.'},
];
const fc=document.getElementById('faq-c');
faqs.forEach((f,i)=>{
  const d=document.createElement('div');d.className='faq-item';d.id='fq'+i;
  d.innerHTML=`<div class="faq-q" onclick="tFaq(${i})"><span>${f.q}</span><i class="fas fa-plus faq-qi"></i></div><div class="faq-a"><div class="faq-in">${f.a}</div></div>`;
  fc.appendChild(d);
});
function tFaq(i){document.getElementById('fq'+i).classList.toggle('open')}

function switchL(btn,id){
  document.querySelectorAll('.ltab').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.lpanel').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');document.getElementById(id).classList.add('on');
}

function toast(msg,col){
  const t=document.getElementById('toast');t.textContent=msg;t.style.color=col||'#a78bfa';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);
}

function depDomainInput(){
  const v=document.getElementById('dep-dom').value.trim();
  const prev=document.getElementById('dep-dom-preview');
  if(v){prev.style.display='flex';document.getElementById('dep-dom-val').textContent=v.toLowerCase().replace(/[^a-z0-9\-]/g,'');}
  else prev.style.display='none';
}
function depFileChange(){
  const f=document.getElementById('dep-file').files[0];
  const info=document.getElementById('dep-file-info');
  if(f){info.style.display='flex';document.getElementById('dep-file-name').textContent=f.name+' — '+(f.size/1024).toFixed(0)+' KB';}
  else info.style.display='none';
}
function clnUrlInput(){
  const v=document.getElementById('cln-url').value.trim();
  const prev=document.getElementById('url-prev');
  if(!v){prev.style.display='none';return;}
  let url=v.startsWith('http')?v:'https://'+v;
  try{
    const u=new URL(url);
    document.getElementById('url-prev-domain').textContent=u.hostname;
    document.getElementById('url-prev-full').textContent=url;
    prev.style.display='block';
  }catch{prev.style.display='none';}
}

function setStepTrack(prefix,n,count){
  for(let i=0;i<count;i++){
    const d=document.getElementById(prefix+'d-'+i);
    const l=document.getElementById(prefix+'l-'+i);
    if(d)d.className='step-dot'+(i<n?' done':i===n?' active':'');
    if(l&&i<count-1)l.className='step-line'+(i<n?' done':'');
  }
}

function runSteps(sp,tp,count,ms){
  return new Promise(res=>{
    for(let i=0;i<count;i++){const s=document.getElementById(sp+i);if(s)s.className='si';}
    const prog=document.getElementById(sp.replace(/[a-z]$/,'')+'-prog');
    if(prog)prog.style.width='0%';
    if(document.getElementById(sp+'0'))document.getElementById(sp+'0').className='si active';
    setStepTrack(tp,0,count);
    let i=0;
    const iv=setInterval(()=>{
      const prev=document.getElementById(sp+(i-1));if(prev)prev.className='si done';
      i++;
      const pct=Math.round((i/count)*100);
      if(prog)prog.style.width=pct+'%';
      if(i<count){const cur=document.getElementById(sp+i);if(cur)cur.className='si active';setStepTrack(tp,i,count);}
      else{const last=document.getElementById(sp+(i-1));if(last)last.className='si done';setStepTrack(tp,count,count);clearInterval(iv);res();}
    },ms||950);
  });
}

const depHistory=[];
async function doDeploy(){
  const domain=document.getElementById('dep-dom').value.trim();
  const file=document.getElementById('dep-file').files[0];
  const err=document.getElementById('dep-err'),errT=document.getElementById('dep-err-t');
  document.getElementById('dep-res').style.display='none';err.classList.remove('show');
  if(!domain){errT.textContent='Subdomain wajib diisi';err.classList.add('show');return;}
  if(!file){errT.textContent='Pilih file ZIP terlebih dahulu';err.classList.add('show');return;}
  if(!file.name.endsWith('.zip')){errT.textContent='File harus berformat .zip';err.classList.add('show');return;}
  document.getElementById('dep-btn').disabled=true;
  document.getElementById('dep-load').classList.add('show');
  const labels=['UPLOADING...','EXTRACTING...','DEPLOYING...','LIVE!'];
  const lbl=document.getElementById('dep-load-lbl');let li=0;
  const lv=setInterval(()=>{if(li<labels.length-1)lbl.textContent=labels[++li];},1200);
  const sp=runSteps('ds','dep',4,1200);
  const form=new FormData();
  form.append('domain',domain.toLowerCase().replace(/[^a-z0-9\-]/g,''));
  form.append('file',file);
  try{
    const r=await fetch('/api/deploy',{method:'POST',body:form});
    const data=await r.json();await sp;clearInterval(lv);
    document.getElementById('dep-load').classList.remove('show');
    document.getElementById('dep-btn').disabled=false;
    if(!r.ok||!data.ok){errT.textContent=data.error||'Deploy gagal';err.classList.add('show');toast('Deploy gagal','#f87171');return;}
    const url=data.url;
    document.getElementById('dep-res-url').href=url;
    document.getElementById('dep-res-txt').textContent=url;
    document.getElementById('dep-res-info').innerHTML=`<i class="fas fa-clock" style="font-size:9px;margin-right:4px"></i>Deployed ${new Date().toLocaleTimeString('id-ID')}`;
    document.getElementById('dep-open-btn').onclick=()=>window.open(url,'_blank');
    document.getElementById('dep-res').style.display='block';
    depHistory.unshift({url,time:new Date().toLocaleTimeString('id-ID')});
    renderDepHist();toast('Deploy sukses!','#4ade80');
  }catch{
    await sp;clearInterval(lv);
    document.getElementById('dep-load').classList.remove('show');
    document.getElementById('dep-btn').disabled=false;
    errT.textContent='Koneksi gagal. Cek internet kamu.';err.classList.add('show');toast('Error!','#f87171');
  }
}
function renderDepHist(){
  const hw=document.getElementById('dep-hist-wrap');hw.style.display='block';
  document.getElementById('dep-hist').innerHTML=depHistory.slice(0,5).map(h=>`<div class="hist-item" onclick="window.open('${h.url}','_blank')"><div class="hist-dot"></div><div class="hist-url">${h.url}</div><div class="hist-time">${h.time}</div></div>`).join('');
}

async function doClone(){
  let url=document.getElementById('cln-url').value.trim();
  const err=document.getElementById('cln-err'),errT=document.getElementById('cln-err-t');
  document.getElementById('cln-res').style.display='none';err.classList.remove('show');
  if(!url){errT.textContent='Masukkan URL website';err.classList.add('show');return;}
  let target=url.startsWith('http')?url:'https://'+url;
  try{new URL(target);}catch{errT.textContent='URL tidak valid';err.classList.add('show');return;}
  document.getElementById('cln-btn').disabled=true;
  document.getElementById('cln-load').classList.add('show');
  const labels=['CONNECTING...','CRAWLING...','DOWNLOADING...','PACKING...'];
  const lbl=document.getElementById('cln-load-lbl');let li=0;
  const lv=setInterval(()=>{if(li<labels.length-1)lbl.textContent=labels[++li];},1400);
  const sp=runSteps('cs','cln',4,1400);
  try{
    const r=await fetch('/api/clone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:target})});
    await sp;clearInterval(lv);
    document.getElementById('cln-load').classList.remove('show');
    document.getElementById('cln-btn').disabled=false;
    if(!r.ok){const d=await r.json().catch(()=>({}));errT.textContent=d.error||'Clone gagal';err.classList.add('show');toast('Clone gagal','#f87171');return;}
    const blob=await r.blob();
    const domain=new URL(target).hostname;
    const ou=URL.createObjectURL(blob);
    document.getElementById('cln-res-url').href=ou;
    document.getElementById('cln-res-txt').textContent=domain+'.zip';
    document.getElementById('cln-res-info').innerHTML=`<i class="fas fa-weight-hanging" style="font-size:9px;margin-right:4px"></i>Ukuran: ${Math.round(blob.size/1024)} KB — ${new Date().toLocaleTimeString('id-ID')}`;
    document.getElementById('cln-dl-btn').onclick=()=>{const a=document.createElement('a');a.href=ou;a.download=domain+'.zip';a.click();};
    document.getElementById('cln-res').style.display='block';toast('Clone selesai!','#4ade80');
  }catch{
    await sp;clearInterval(lv);
    document.getElementById('cln-load').classList.remove('show');
    document.getElementById('cln-btn').disabled=false;
    errT.textContent='Koneksi gagal. Cek internet kamu.';err.classList.add('show');toast('Error!','#f87171');
  }
}

function copyUrl(id){
  const t=document.getElementById(id);
  if(t&&navigator.clipboard)navigator.clipboard.writeText(t.textContent).then(()=>toast('URL disalin!','#a78bfa'));
}

async function fetchStatus(){
  document.getElementById('st-api').innerHTML='<i class="fas fa-circle-notch fa-spin" style="font-size:12px"></i>';
  try{
    const r=await fetch('/api/status');const d=await r.json();
    document.getElementById('st-dep').textContent=d.deploy??'—';
    document.getElementById('st-cln').textContent=d.clone??'—';
    document.getElementById('st-api').innerHTML='<i class="fas fa-circle" style="font-size:10px;color:var(--gn)"></i>';
    if(document.getElementById('h-dep'))document.getElementById('h-dep').textContent=d.deploy??'—';
    if(document.getElementById('h-cln'))document.getElementById('h-cln').textContent=d.clone??'—';
  }catch{
    document.getElementById('st-api').innerHTML='<i class="fas fa-circle" style="font-size:10px;color:var(--rd)"></i>';
  }
}
fetchStatus();
