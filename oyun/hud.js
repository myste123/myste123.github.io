/* Ortak sade arayuz (tum oyunlar): ust serit, ilk 3, alt olay akisi + hediye seridi.
   OY.hud({baslik, alt, renk, hediyeler:[['🌹','Gül','+10']...]})  ->  OY.akis(t,renk) OY.ilk3([{ad,foto,id,puan}]) OY.bilgi(sol,sag) OY.kazanan(html) */
(function () {
  const css = `
  .h-ust{position:fixed;top:1.6vh;left:3vw;right:3vw;display:flex;align-items:center;gap:1.4vh;pointer-events:none;z-index:20}
  .h-bas{flex:1;min-width:0}
  .h-bas b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:900 min(3.3vh,5.6vw)/1 Segoe UI,Arial;letter-spacing:.04em;color:#fff;text-shadow:0 .3vh 1vh rgba(0,0,0,.7)}
  .h-bas span{display:block;font:600 1.55vh/1.3 Segoe UI,Arial;color:rgba(255,255,255,.9);margin-top:.5vh;text-shadow:0 .2vh .6vh #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .h-cip{background:rgba(8,10,25,.55);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.15);border-radius:3vh;padding:.6vh 1.2vh;font:800 1.5vh Segoe UI,Arial;color:#fff;white-space:nowrap}
  .h-ilk{position:fixed;top:8.4vh;left:3vw;display:flex;gap:1vh;pointer-events:none;z-index:20}
  .h-ilk div{display:flex;align-items:center;gap:.7vh;background:rgba(8,10,25,.55);backdrop-filter:blur(6px);border-radius:3vh;padding:.4vh 1.2vh .4vh .4vh;font:700 1.45vh Segoe UI,Arial;color:#fff;max-width:28vw}
  .h-ilk img{width:2.9vh;height:2.9vh;border-radius:50%;border:.25vh solid var(--r)}
  .h-ilk span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .h-ilk i{font-style:normal;color:var(--r)}
  .h-alt{position:fixed;left:3vw;right:3vw;bottom:1.4vh;pointer-events:none;z-index:20}
  .h-akis{display:flex;flex-direction:column;gap:.5vh;margin-bottom:1vh;align-items:flex-start}
  .h-akis div{background:rgba(8,10,25,.6);backdrop-filter:blur(6px);border-radius:1.4vh;padding:.45vh 1.3vh;font:600 1.5vh Segoe UI,Arial;max-width:80vw;animation:hg .35s ease-out}
  .h-akis div:first-child{border:1px solid var(--r);box-shadow:0 0 1.2vh rgba(0,0,0,.4)}.h-akis div:nth-child(2){opacity:.72}.h-akis div:nth-child(3){opacity:.45}
  .h-vit{position:fixed;left:50%;top:13.6vh;max-width:72vw;transform:translateX(-50%);z-index:25;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:.6vh}
  .h-vit .kart{display:flex;align-items:center;gap:.9vh;background:rgba(15,10,35,.88);border:.18vh solid var(--r);border-radius:4vh;padding:.4vh 1.4vh .4vh .4vh;animation:vg .5s cubic-bezier(.2,1.6,.4,1),vc .5s 3.2s forwards;box-shadow:0 1vh 4vh rgba(0,0,0,.5)}
  .h-vit img{width:3.4vh;height:3.4vh;border-radius:50%;border:.2vh solid #fff}.h-vit .ik{font-size:3vh;line-height:1;animation:vz .6s infinite alternate}
  .h-vit .y{white-space:nowrap}.h-vit .y b{display:block;font:700 1.3vh Nunito;color:#ddd}.h-vit .y span{display:block;font:800 1.6vh Nunito;color:var(--r);overflow:hidden;text-overflow:ellipsis}
  @keyframes vg{from{transform:scale(.3) translateY(-4vh);opacity:0}}@keyframes vc{to{opacity:0;transform:translateY(-3vh)}}@keyframes vz{to{transform:scale(1.15) rotate(8deg)}}
  @keyframes hg{from{transform:translateY(1vh);opacity:0}}
  .h-hed{display:grid;grid-template-columns:repeat(3,1fr);gap:.6vh}
  .h-hed div{background:rgba(8,10,25,.6);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);border-radius:1.3vh;padding:.6vh .4vh;text-align:center;font:600 1.25vh/1.25 Segoe UI,Arial;color:rgba(255,255,255,.85)}
  .h-hed b{display:block;font-size:1.5vh;color:var(--r)}
  .h-rkz{position:fixed;right:3vw;bottom:15.2vh;z-index:19;display:flex;align-items:center;gap:.8vh;background:linear-gradient(135deg,rgba(124,92,255,.85),rgba(255,77,141,.85));border-radius:1.6vh;padding:.7vh 1.2vh;pointer-events:none;animation:rkz 4s ease-in-out infinite;box-shadow:0 .6vh 2vh rgba(0,0,0,.35)}.h-rkz b{font-size:2.4vh}.h-rkz span{font:800 1.25vh/1.25 Nunito;color:#fff}.h-rkz i{font-style:normal;font-weight:900;font-size:1.4vh}@keyframes rkz{0%,100%{transform:translateY(0)}50%{transform:translateY(-.8vh)}}
  .h-rek{text-align:center;font:600 1.15vh Segoe UI,Arial;color:rgba(255,255,255,.55);margin-top:.7vh}
  .h-kaz{position:fixed;inset:0;display:none;place-items:center;background:radial-gradient(rgba(0,0,0,.25),rgba(0,0,0,.7));z-index:30;text-align:center;color:#fff}
  .h-kaz div{font:900 4vh/1.2 Segoe UI,Arial;color:var(--r);text-shadow:0 0 3vh rgba(0,0,0,.8)}
  .h-kaz small{display:block;font:600 2vh Segoe UI,Arial;color:#fff;margin-top:1vh}
  .h-kaz img{width:12vh;height:12vh;border-radius:50%;border:.5vh solid var(--r);display:block;margin:0 auto 1.5vh}
  .balon{position:fixed;transform:translate(-50%,-100%);background:#fff;color:#111;padding:.45vh 1vh;border-radius:1.2vh;font:700 1.45vh Segoe UI,Arial;max-width:34vw;pointer-events:none;z-index:15;box-shadow:0 .3vh 1vh rgba(0,0,0,.3)}`;
  const fl=document.createElement('link');fl.rel='stylesheet';fl.href='https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;700;800;900&display=swap';document.head.appendChild(fl);
  const st = document.createElement('style'); st.textContent = css.replace(/Segoe UI,Arial/g,"Nunito,Segoe UI,Arial").replace('font:900 min(3.3vh,5.6vw)/1 Nunito','font:800 min(3.6vh,6vw)/1 "Baloo 2"'); document.head.appendChild(st);
  let AK, IL, SOL, SAG, KZ;
  OY.hud = cfg => {
    document.documentElement.style.setProperty('--r', cfg.renk || '#ffd84a');
    const d = document.createElement('div'); d.innerHTML = `
     <div class="h-ust"><div class="h-bas"><b style="font-size:${cfg.baslik.length>13?"min(2.5vh,4.6vw)":""}">${cfg.baslik}</b><span>${cfg.alt || ''}</span></div><div class="h-cip" id="hSol">⏱ 3:00</div><div class="h-cip" id="hSag">👥 0</div></div>
     <div class="h-ilk" id="hIlk"></div>
     <div class="h-alt"><div class="h-akis" id="hAkis"></div><div class="h-hed">${(cfg.hediyeler || []).map(h => `<div><b>${h[0]} ${h[1]}</b>${h[2]}</div>`).join('')}</div>
     </div>
     <div class="h-vit" id="hVit"></div><div class="h-kaz" id="hKaz"><div id="hKazI"></div></div>`;
    if(!new URLSearchParams(location.search).get('k'))d.insertAdjacentHTML('beforeend','<div class="h-rkz"><b>🎮</b><span>Bu oyunu yayınına kirala<br><i>TT @bilesikyatirim</i></span></div>');document.body.appendChild(d); AK = d.querySelector('#hAkis'); IL = d.querySelector('#hIlk'); SOL = d.querySelector('#hSol'); SAG = d.querySelector('#hSag'); KZ = d.querySelector('#hKaz');
  };
  OY.akis = (t, renk = '#fff') => { if (!AK) return; const d = document.createElement('div'); d.style.color = renk; d.textContent = t; AK.prepend(d); while (AK.children.length > 3) AK.lastChild.remove() };
  OY.bilgi = (sol, sag) => { if (SOL && SOL.textContent !== sol) SOL.textContent = sol; if (SAG && SAG.textContent !== sag) SAG.textContent = sag };
  let ilkSon = '';
  OY.ilk3 = liste => { if (!IL) return; const k = liste.map(u => u.id + ':' + Math.round(u.puan)).join(); if (k === ilkSon) return; ilkSon = k;
    IL.innerHTML = liste.slice(0, 3).map((u, i) => `<div><img src="${OY.foto(u, 64).toDataURL()}"><span>${['🥇', '🥈', '🥉'][i]} ${OY.kisaAd(u.ad, 10)}</span><i>${Math.round(u.puan)}</i></div>`).join('') };
  OY.kazanan = (u, baslik, alt) => { if (!KZ) return; if (!u) { KZ.style.display = 'none'; return }
    KZ.querySelector('#hKazI').innerHTML = `<img src="${OY.foto(u, 128).toDataURL()}">${baslik}<br>${u.ad}<small>${alt || ''}</small>`; KZ.style.display = 'grid' };
  const VQ=[];let vAktif=0;
  OY.vitrin = (u, ikon, ad, etki) => { VQ.push({ u, ikon, ad, etki }); if (VQ.length > 4) VQ.splice(0, VQ.length - 4); if (!vAktif) vSonraki() };
  function vSonraki() { const V = document.getElementById('hVit'), v = VQ.shift(); if (!V || !v) { vAktif = 0; return } vAktif = 1;
    V.innerHTML = `<div class="kart"><img src="${OY.foto(v.u, 96).toDataURL()}"><div class="y"><b>${OY.kisaAd(v.u.ad, 14)} · ${v.ad}</b><span>${v.etki}</span></div><div class="ik">${v.ikon}</div></div>`;
    setTimeout(vSonraki, VQ.length ? 1800 : 3700) }
  OY.sure = sn => `⏱ ${Math.floor(sn / 60)}:${String(Math.floor(sn % 60)).padStart(2, '0')}`;
})();
/* Ortak rekabet hediyeleri: oyun OY.rekabetKur({liste, skor, ayarla, dondur?}) ile baglar */
(function () {
  let R = null; const now = () => performance.now();
  OY.rekabetKur = r => { R = r };
  OY.korunuyor = u => u.kalkan > now();
  OY.donuk = u => u.donuk > now();
  OY.ikiKat = u => u.x2bit > now() ? 2 : 1;
  OY.rekabetHediye = (u, h) => {
    if (!R) return 'güç';
    const liste = R.liste().filter(x => x !== u), lider = liste.sort((a, b) => R.skor(b) - R.skor(a))[0];
    const hedefOk = lider && !OY.korunuyor(lider);
    switch (h.sinif) {
      case 'gul': return 'güç kazandı';
      case 'kalp': u.kalkan = now() + 20000; return '20 sn KALKAN 🛡';
      case 'parfum': if (!lider) return 'güç kazandı'; if (!hedefOk) return `${OY.kisaAd(lider.ad, 10)} kalkanlı, donmadı!`;
        lider.donuk = now() + 8000; R.dondur && R.dondur(lider); return `${OY.kisaAd(lider.ad, 10)} 8 sn DONDU ❄`;
      case 'donut': { if (!lider) return 'güç kazandı'; if (!hedefOk) return `${OY.kisaAd(lider.ad, 10)} kalkanlı!`;
        const c = R.skor(lider) * .15; R.ayarla(lider, R.skor(lider) - c); R.ayarla(u, R.skor(u) + c); return `${OY.kisaAd(lider.ad, 10)}'den ${Math.round(c)} çaldı 🦹` }
      case 'sapka': { if (!lider || R.skor(lider) <= R.skor(u)) return 'zaten lider 👑'; if (!hedefOk) return `${OY.kisaAd(lider.ad, 10)} kalkanlı!`;
        const a = R.skor(u); R.ayarla(u, R.skor(lider)); R.ayarla(lider, a); return `${OY.kisaAd(lider.ad, 10)} ile YER DEĞİŞTİ 🔄` }
      case 'galaksi': for (const x of liste) if (!OY.korunuyor(x)) R.ayarla(x, R.skor(x) * .75); u.x2bit = now() + 20000; OY.ses && OY.ses.patla(); return 'BOMBA 💣 herkes -%25 · 20 sn 2x';
    }
    return 'güç';
  };
  OY.REKABET_HED = [['🌹', 'Gül', 'güç'], ['💖', 'Kalp', 'kalkan'], ['💐', 'Parfüm', 'lideri dondur'], ['🍩', 'Donut', 'liderden çal'], ['🎩', 'Şapka', 'liderle yer değiş'], ['🌌', 'Galaksi', 'bomba · 2x']];
})();
OY.durum=u=>(OY.donuk(u)?'❄':'')+(OY.korunuyor(u)?'🛡':'')+(OY.ikiKat(u)>1?'2x ':'');
