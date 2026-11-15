/* Myste Oyun Motoru - tum oyunlarin ortak cekirdegi
   Kaynaklar: canli (lisans ?k=KOD -> ws), sim (site simulatoru postMessage), demo (?demo=1 otomatik sahte olaylar)
   Olay: {t:'begeni'|'yorum'|'hediye'|'takip'|'paylasim', id, ad, foto, adet, metin, hediye, elmas}
   Kullanim: OY.basla({ad:'Halay', olay:e=>{...}}) */
(function () {
  const Q = new URLSearchParams(location.search);
  const OY = window.OY = { Q, sim: Q.has('sim'), demo: Q.has('demo'), kod: Q.get('k') || '', kilit: null, durum: '', izleyici: 0, kalici: null };
  const dinleyici = [];
  OY.on = f => dinleyici.push(f);
  function dagit(e) { if (OY.kilit && e.t !== 'kilit') return; for (const f of dinleyici) try { f(e) } catch (x) { console.log(x) } }
  OY.ates = dagit;

  // ---- hediye -> standart guc seviyesi (elmas degerine gore) ----
  const HED = { 'Rose': ['Gül', 1], 'TikTok': ['TikTok', 1], 'GG': ['GG', 1], 'Ice Cream Cone': ['Dondurma', 1], 'Finger Heart': ['Kalp', 5],
    'Heart Me': ['Kalp', 1], 'Doughnut': ['Donut', 30], 'Hat and Mustache': ['Şapka', 99], 'Perfume': ['Parfüm', 20], 'Hand Hearts': ['Eller', 100],
    'Corgi': ['Korgi', 299], 'Galaxy': ['Galaksi', 1000], 'Lion': ['Aslan', 29999], 'Universe': ['Evren', 34999] };
  // 6 hediye sinifi: her oyun her sinifa ayri etki verir (gul, kalp, parfum, donut, sapka, galaksi)
  const SINIF = [['gul', '🌹', 1], ['kalp', '💖', 5], ['parfum', '💐', 20], ['donut', '🍩', 30], ['sapka', '🎩', 99], ['galaksi', '🌌', 1000]];
  OY.hediye = e => { const h = HED[e.hediye] || [e.hediye || 'Hediye', e.elmas || 1]; const el = e.elmas || h[1] || 1;
    let s = SINIF[0]; for (const x of SINIF) if (el >= x[2]) s = x; if (e.hediye === 'Finger Heart' || e.hediye === 'Heart Me') s = SINIF[1];
    return { resim: e.resim || '', ad: h[0], elmas: el, seviye: el >= 1000 ? 4 : el >= 99 ? 3 : el >= 20 ? 2 : 1, adet: e.adet || 1, sinif: s[0], ikon: s[1] } };

  // ---- profil fotografi (yuklenemezse bas harfli renkli daire) ----
  const FOTO = {};
  OY.foto = (u, boy = 128) => {
    const k = u.id || u.ad; if (FOTO[k]) return FOTO[k];
    const c = document.createElement('canvas'); c.width = c.height = boy; const g = c.getContext('2d', { willReadFrequently: true });
    const renk = `hsl(${[...String(k)].reduce((a, b) => a + b.charCodeAt(0), 0) * 47 % 360},70%,55%)`;
    const ciz0 = () => { g.fillStyle = renk; g.beginPath(); g.arc(boy / 2, boy / 2, boy / 2, 0, 7); g.fill(); g.fillStyle = '#fff';
      g.font = `bold ${boy * .5}px Segoe UI,Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((u.ad || '?')[0].toUpperCase(), boy / 2, boy / 2 + 2) };
    ciz0(); FOTO[k] = c; c.hazir = 0;
    if (u.foto) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { g.clearRect(0, 0, boy, boy); g.save(); g.beginPath(); g.arc(boy / 2, boy / 2, boy / 2, 0, 7); g.clip(); g.drawImage(im, 0, 0, boy, boy); g.restore(); c.hazir = 1; c.surum = (c.surum || 0) + 1 }; im.src = u.foto }
    return c;
  };
  OY.kisaAd = (s, n = 12) => { s = String(s || '?'); return s.length > n ? s.slice(0, n - 1) + '…' : s };

  // ---- ses: efektler (WebAudio sentez, telifsiz) ----
  let AC = null, ANA = null, MZ = null;
  const efektSes = Math.min(1, (+(Q.get('efekt') ?? 80)) / 100), muzikSes = Math.min(1, (+(Q.get('muzik') ?? 60)) / 100);
  function ac() { if (AC) return; AC = new (window.AudioContext || window.webkitAudioContext)(); ANA = AC.createGain(); ANA.gain.value = efektSes; ANA.connect(AC.destination);
    MZ = AC.createGain(); MZ.gain.value = muzikSes * .5; MZ.connect(AC.destination); muzikBasla() }
  ['pointerdown', 'keydown', 'touchstart'].forEach(x => addEventListener(x, () => { ac(); AC && AC.state === 'suspended' && AC.resume() }, { passive: true }));
  setTimeout(() => { try { ac() } catch (e) { } }, 300); // LIVE Studio/OBS tarayici kaynagi otomatik oynatir
  function ton(f, s, tip = 'sine', v = .3, kay = 0, hedef = ANA, ne = 0) {
    if (!AC) return; const t = AC.currentTime + ne, o = AC.createOscillator(), g = AC.createGain(); o.type = tip; o.frequency.setValueAtTime(f, t);
    if (kay) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * kay), t + s); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + s);
    o.connect(g); g.connect(hedef); o.start(t); o.stop(t + s + .05) }
  function gurultu(s, v = .3, fr = 1200, hedef = ANA, ne = 0) { if (!AC) return; const t = AC.currentTime + ne, b = AC.createBuffer(1, AC.sampleRate * s, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const n = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    f.type = 'bandpass'; f.frequency.value = fr; g.gain.value = v; n.buffer = b; n.connect(f); f.connect(g); g.connect(hedef); n.start(t) }
  OY.ses = {
    pop: () => { ton(600, .12, 'sine', .3, .3); gurultu(.08, .2, 2000) }, tik: () => ton(1200, .05, 'square', .08),
    para: () => { ton(988, .08, 'square', .12); ton(1319, .25, 'square', .12, 0, ANA, .08) },
    guc: () => { ton(220, .5, 'sawtooth', .15, 4) }, patla: () => { gurultu(.5, .5, 300); ton(80, .4, 'sine', .4, .3) },
    zafer: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, .3, 'triangle', .2, 0, ANA, i * .12)),
    korna: () => { ton(440, .35, 'square', .12); ton(554, .35, 'square', .12) }, davul: () => { ton(90, .25, 'sine', .6, .4); gurultu(.12, .25, 150) },
    yanlis: () => ton(200, .3, 'sawtooth', .12, .6), dogru: () => { ton(784, .1, 'triangle', .2); ton(1175, .3, 'triangle', .2, 0, ANA, .1) },
    ton, gurultu,
    // gercek ses dosyasi (onbellekli, WebAudio): OY.ses.dosya('ses/x.mp3', .8, hiz)
    dosya: (url, v = 1, hiz = 1, sure = 0) => { if (!AC) return; const c = BUF[url] || (BUF[url] = fetch(url).then(r => r.arrayBuffer()).then(x => AC.decodeAudioData(x)).catch(() => null));
      c.then(b => { if (!b) return; const n = AC.createBufferSource(), g = AC.createGain(); n.buffer = b; n.playbackRate.value = hiz; g.gain.value = v; n.connect(g); g.connect(ANA); if (sure) n.start(0, 0, sure); else n.start() }) },
    // surekli dongu ses (lastik bagirmasi vb.): const d=OY.ses.dongu('ses/x.mp3'); d.ayar(ses, hiz) her karede
    dongu: (url) => { let g = null, n = null; return { ayar(v, h = 1) { if (!AC) return; if (!g) { g = AC.createGain(); g.gain.value = 0; g.connect(ANA);
        (BUF[url] || (BUF[url] = fetch(url).then(r => r.arrayBuffer()).then(x => AC.decodeAudioData(x)).catch(() => null))).then(b => { if (!b) return; n = AC.createBufferSource(); n.buffer = b; n.loop = true; n.connect(g); n.start() }) }
        g.gain.setTargetAtTime(Math.max(0, v), AC.currentTime, .06); if (n) n.playbackRate.setTargetAtTime(h, AC.currentTime, .1) } } }
  };
  const BUF = {};

  // ---- muzik: kendi urettigimiz telifsiz ritimler veya yayincinin kendi dosyasi (&muzikurl=) ----
  const STIL = { halay: { bpm: 112, kok: 196, olcek: [0, 1, 4, 5, 7, 8, 10] }, pop: { bpm: 118, kok: 220, olcek: [0, 2, 4, 7, 9] },
    elektro: { bpm: 126, kok: 110, olcek: [0, 3, 5, 7, 10] }, dugun: { bpm: 132, kok: 233, olcek: [0, 1, 4, 5, 7, 8, 11] }, sakin: { bpm: 84, kok: 262, olcek: [0, 2, 4, 7, 9] } };
  OY.muzikStil = 'pop';
  function muzikBasla() {
    const url = Q.get('muzikurl'); if (muzikSes <= 0) return;
    if (url) { const a = new Audio(url); a.loop = true; a.volume = muzikSes; a.crossOrigin = 'anonymous'; a.play().catch(() => { }); OY.muzikEl = a; return }
    if (OY.muzikListe && OY.muzikListe.length) { let i = Math.random() * OY.muzikListe.length | 0; const a = new Audio(); a.volume = muzikSes * .7; OY.muzikEl = a;
      const cal = () => { a.src = OY.muzikListe[i++ % OY.muzikListe.length]; a.play().catch(() => setTimeout(cal, 3000)) }; a.onended = cal; a.onerror = () => setTimeout(cal, 1000); cal(); return }
    let adim = 0, motif = []; const yeniMotif = s => { motif = Array.from({ length: 16 }, () => Math.random() < .6 ? s.olcek[Math.random() * s.olcek.length | 0] + (Math.random() < .25 ? 12 : 0) : null) };
    const dongu = () => { const s = STIL[Q.get('stil') || OY.muzikStil] || STIL.pop; if (!motif.length || adim % 64 === 0) yeniMotif(s); const sure = 60 / s.bpm / 2;
      const i = adim % 16, n = motif[i];
      if (i % 4 === 0) { ton(s.kok / 2 * (i === 8 ? 1.5 : 1), sure * 1.6, 'triangle', .35, 0, MZ); ton(70, .2, 'sine', .7, .4, MZ) }
      if (i % 4 === 2) gurultu(.06, .25, 5000, MZ); if (OY.muzikStil === 'halay' || OY.muzikStil === 'dugun') { if (i % 8 === 6) ton(110, .15, 'sine', .5, .5, MZ) }
      if (n !== null) ton(s.kok * Math.pow(2, n / 12), sure * .9, OY.muzikStil === 'elektro' ? 'sawtooth' : 'square', .06, 0, MZ);
      adim++; setTimeout(dongu, sure * 1000) };
    dongu();
  }

  // ---- canli baglanti ----
  OY.gonder = d => { try { OY.ws && OY.ws.readyState === 1 && OY.ws.send(JSON.stringify(d)) } catch (e) { } };
  OY.kaydet = veri => { try { if (OY.kod) OY.gonder({ t: 'kaydet', veri }); else localStorage.setItem('oy_' + location.pathname, JSON.stringify(veri)) } catch (e) { } };
  function kalici() { if (OY.kod) return; try { const v = localStorage.getItem('oy_' + location.pathname); if (v) dagit({ t: 'kalici', veri: JSON.parse(v) }) } catch (e) { } }
  let wsHata = 0;
  function bagla() {
    const h = location.host; OY.ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${h}/ws${location.search}`);
    OY.ws.onmessage = m => { try { const e = JSON.parse(m.data); if (e.t === 'kilit') OY.kilit = e.metin || 'Süre doldu'; if (e.t === 'durum') { OY.durum = e.metin; if ('canli' in e) OY.canli = e.canli } if (e.t === 'yorum' || e.t === 'begeni' || e.t === 'hediye') OY.canli = true;
      if (e.t === 'izleyici') OY.izleyici = e.sayi; if (e.t === 'konus' && e.ses) sesCal(e.ses); dagit(e) } catch (x) { console.log(x) } };
    OY.ws.onopen = () => { wsHata = 0 };
    OY.ws.onclose = () => { if (OY.kilit) return; OY.canli = false; wsHata++; const gr = Q.get('geri');
      if (gr && wsHata >= 6) { const q = new URLSearchParams(location.search); q.delete('geri'); location.href = gr + '?' + q } else setTimeout(bagla, 2000) };
  }
  function sesCal(yol) { const a = new Audio((yol[0]==='/'||yol.startsWith('http')) ? yol : '/' + yol); a.volume = .95; if (MZ) { MZ.gain.value = muzikSes * .15 } if (OY.muzikEl) OY.muzikEl.volume = muzikSes * .2;
    const bit = () => { if (MZ) MZ.gain.value = muzikSes * .5; if (OY.muzikEl) OY.muzikEl.volume = muzikSes * (OY.muzikListe ? .7 : 1); OY.gonder({ t: 'bitti' }) }; a.onended = bit; a.onerror = bit; a.play().catch(bit); if (OY.yuzKonus) OY.yuzKonus(a) }

  // ---- demo / simulasyon ----
  const ADLAR = ['Ayşe', 'Mehmet', 'Zeynep', 'Emre', 'Elif', 'Burak', 'Selin', 'Can', 'Deniz', 'Kerem', 'Ece', 'Mert', 'Derya', 'Oğuz', 'Buse', 'Kaan', 'İrem', 'Yusuf', 'Gizem', 'Arda', 'Nisa', 'Furkan', 'Melis', 'Onur'];
  const YORUM = ['Selam herkese', 'Hadi hadi!', 'Ben de varım', 'Çok iyi oyun', 'Kim kazanır?', 'Bana da gül atın', 'Süpersin', 'Yaşasın', 'Ooo', 'Helal', 'Bir daha!', 'Haydi bakalım'];
  const HEDL = [['Rose', 1], ['Rose', 1], ['Rose', 1], ['Finger Heart', 5], ['Finger Heart', 5], ['Perfume', 20], ['Doughnut', 30], ['Hat and Mustache', 99], ['Galaxy', 1000]];
  OY.sahteKisi = i => { const ad = ADLAR[i % ADLAR.length] + (i >= ADLAR.length ? (i / ADLAR.length | 0) : ''); return { id: 'd' + i, ad, foto: '' } };
  function demoDongu() { let n = 0; setInterval(() => { const u = OY.sahteKisi(Math.random() * 14 | 0), r = Math.random();
    if (r < .6) dagit({ t: 'begeni', ...u, adet: 1 + (Math.random() * 5 | 0) }); else if (r < .9) dagit({ t: 'yorum', ...u, metin: OY.demoYorum ? OY.demoYorum() : YORUM[Math.random() * YORUM.length | 0] });
    else if (r < .95) { const h = Math.random() < .7 ? HEDL[0] : HEDL[Math.random() * HEDL.length | 0]; dagit({ t: 'hediye', ...u, hediye: h[0], elmas: h[1], adet: 1 }) } else dagit({ t: Math.random() < .5 ? 'takip' : 'paylasim', ...u }); n++ }, 1700) }
  addEventListener('message', m => { const e = m.data; if (e && e.oy) { delete e.oy; dagit(e) } });

  OY.basla = cfg => {
    OY.ayar = cfg; if (cfg.muzik) OY.muzikStil = cfg.muzik; if (cfg.olay) OY.on(cfg.olay);
    if (OY.kod && !OY.sim) bagla(); else { kalici(); if (OY.demo || (!OY.sim && !OY.kod)) demoDongu() }
  };
  // ---- yapay zeka sunucu yuz kamerasi: tek video, 3x2 izgarada ayni kafa hareketinin 6 agiz kademesi ----
  // her karede ses siddetine gore kademe secilir (komsu iki kademe harmanlanir) -> kafa/nefes/goz kesintisiz, agiz sese oturur
  (() => {
    if (Q.get('yuz') !== '1') return; // varsayilan KAPALI (?yuz=1 ile acilir)
    const st2 = document.createElement('style');
    st2.textContent = '#oyYuz{position:fixed;z-index:18;height:var(--yuz-b,20vh);aspect-ratio:300/372;border-radius:1.6vh;pointer-events:none;' +
      'padding:.4vh;background:linear-gradient(135deg,#ff3ad8,#7c5cff,#22e5ff);box-shadow:0 0 2.2vh rgba(255,58,216,.5),0 .8vh 2vh rgba(0,0,0,.45);opacity:0;transition:opacity .6s}' +
      '#oyYuz .ic{position:relative;width:100%;height:100%;border-radius:1.3vh;overflow:hidden;background:#2a1a3a}' +
      '#oyYuz canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;display:block!important;z-index:auto!important;filter:none!important}' +
      '#oyYuz i{position:absolute;right:5%;top:4%;font:800 1.05vh/1 Nunito,Segoe UI,Arial;font-style:normal;color:#fff;background:rgba(0,0,0,.45);padding:.22vh .45vh;border-radius:.5vh;letter-spacing:.05vh}' +
      '#oyYuz b{position:absolute;left:6%;top:4%;font:800 1.05vh/1 Nunito,Segoe UI,Arial;color:#fff;background:#ff2d55;padding:.22vh .5vh;border-radius:.5vh;letter-spacing:.05vh}';
    document.head.appendChild(st2);
    const TW = 300, TH = 372;
    let kutu, v, cv, g, zarf = null, el = null, agiz = 0, hazir = false;
    OY.yuzKonus = a => {
      el = a; zarf = null; const yol = a.src;
      fetch(yol).then(r => r.arrayBuffer()).then(b => new OfflineAudioContext(1, 1, 22050).decodeAudioData(b)).then(buf => {
        const d = buf.getChannelData(0), n = Math.floor(buf.sampleRate / 50), Z = [];
        for (let i = 0; i + n <= d.length; i += n) { let t = 0; for (let j = i; j < i + n; j++) t += d[j] * d[j]; Z.push(Math.sqrt(t / n)) }
        const sr = Z.slice().sort((x, y) => x - y), ust = sr[Math.floor(sr.length * .95)] || 1; zarf = Z.map(v => Math.min(1, v / ust));
      }).catch(() => { zarf = null });
    };
    function kur() {
      kutu = document.createElement('div'); kutu.id = 'oyYuz'; const k = OY.yuzKonum || { top: '24vh', right: 'calc(2.5*var(--vw,1vw))' };
      for (const x in k) kutu.style.setProperty(x.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), k[x]);
      const ic = document.createElement('div'); ic.className = 'ic'; kutu.appendChild(ic);
      cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; g = cv.getContext('2d'); ic.appendChild(cv);
      v = document.createElement('video'); v.src = 'doku/sunucu_yuz6.mp4'; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto'; v.setAttribute('muted', '');
      v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none'; document.body.appendChild(v); v.play().catch(() => { });
      const ai = document.createElement('i'); ai.textContent = 'AI'; ic.appendChild(ai);
      const cn = document.createElement('b'); cn.textContent = '● CANLI'; ic.appendChild(cn); document.body.appendChild(kutu);
      requestAnimationFrame(ciz);
    }
    const kutuCiz = (i, al) => { g.globalAlpha = al; g.drawImage(v, (i % 3) * TW, Math.floor(i / 3) * TH, TW, TH, 0, 0, TW, TH) };
    function ciz(t) {
      requestAnimationFrame(ciz);
      if (v.paused) v.play().catch(() => { }); if (v.readyState < 2) return;
      if (!hazir) { hazir = true; kutu.style.opacity = '1' }
      let hedef = 0;
      if (el && !el.paused && !el.ended) {
        if (zarf) { const i = Math.floor(el.currentTime * 50 + 1); const s = (zarf[i] || 0) * .6 + (zarf[i + 1] || 0) * .4; hedef = s < .1 ? 0 : Math.min(5, .6 + (s - .1) / .9 * 4.6) }
        else { const h = el.currentTime * 4.6; hedef = Math.max(0, Math.sin(h * Math.PI * 2) * 2.2 + Math.sin(h * 2.3) * 1.2 + 1.4) }
      }
      agiz += (hedef - agiz) * (hedef > agiz ? .5 : .32); window.__yuzAgiz = agiz;
      const i0 = Math.min(5, Math.floor(agiz)), fr = agiz - i0;
      kutuCiz(i0, 1); if (fr > .04 && i0 < 5) kutuCiz(i0 + 1, fr); g.globalAlpha = 1;
    }
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', kur); else kur();
  })();
  // kilit / durum katmani (DOM, her oyun icin ayni)
  const st = document.createElement('style'); st.textContent = '#oyKilit{position:fixed;inset:0;display:none;place-items:center;background:rgba(5,8,20,.92);color:#fff;font:700 54px Segoe UI,Arial;text-align:center;z-index:99}#oyKilit small{display:block;font-size:30px;font-weight:400;opacity:.8;margin-top:20px}#oyBekle{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;z-index:98;pointer-events:none;width:min(78vw,520px);padding:22px 20px;border-radius:22px;background:rgba(8,10,24,.86);border:2px solid rgba(255,64,110,.85);box-shadow:0 10px 40px rgba(0,0,0,.5);color:#fff;text-align:center;font:800 clamp(18px,3.6vh,30px) Nunito,Segoe UI,Arial;line-height:1.25}#oyBekle i{display:inline-block;width:.6em;height:.6em;border-radius:50%;background:#ff2d55;margin-right:.4em;vertical-align:.08em;animation:oyNab 1.1s infinite}#oyBekle small{display:block;margin-top:10px;font-size:.62em;font-weight:600;opacity:.82}@keyframes oyNab{50%{opacity:.25}}';
  document.head.appendChild(st);
  addEventListener('DOMContentLoaded', () => { const k = document.createElement('div'); k.id = 'oyKilit'; document.body.appendChild(k);
    const b = document.createElement('div'); b.id = 'oyBekle'; b.innerHTML = '<i></i>Canlı yayını başlatın<small>Oyun yayınınıza kendiliğinden bağlanacak</small>'; document.body.appendChild(b);
    setInterval(() => { b.style.display = (OY.kod && !OY.sim && !OY.kilit && !OY.canli) ? 'block' : 'none'; if (OY.kilit) { k.style.display = 'grid'; k.innerHTML = `<div>🔒 ${OY.kilit}<small>Myste Medya · myste123.github.io</small></div>` } }, 1000) });
})();
