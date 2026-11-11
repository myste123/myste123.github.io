/* 3B yardimcilari: GLB model yukleme/klonlama + animasyon (Kenney CC0 modelleri, model/ klasoru) */
(function () {
  const yukleyici = new THREE.GLTFLoader(), onbellek = {};
  const UC = window.UC = {};
  UC.yukle = yol => onbellek[yol] || (onbellek[yol] = new Promise((ok, red) => yukleyici.load(yol, g => {
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) o.material.side = THREE.FrontSide } }); ok(g) }, undefined, red)));
  // iskeletli modeli dogru klonla, kendi animasyon karistiricisiyla dondur
  UC.ornek = async (yol, olcek = 1) => {
    const g = await UC.yukle(yol); const sahne = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(g.scene) : g.scene.clone(true);
    sahne.scale.setScalar(olcek); const mix = new THREE.AnimationMixer(sahne), eylem = {};
    for (const a of g.animations) eylem[a.name] = mix.clipAction(a);
    let simdiki = null;
    const oynat = (ad, { hiz = 1, tek = false, gecis = .25 } = {}) => {
      const e = eylem[ad]; if (!e) return; if (simdiki === e && !tek) { e.timeScale = hiz; return }
      e.reset(); e.timeScale = hiz; e.setLoop(tek ? THREE.LoopOnce : THREE.LoopRepeat); e.clampWhenFinished = tek;
      if (simdiki && simdiki !== e) simdiki.crossFadeTo(e, gecis, false); e.play();
      if (tek) { const onceki = simdiki; mix.addEventListener('finished', function f(ev) { if (ev.action === e) { mix.removeEventListener('finished', f); if (onceki) { onceki.reset().play(); e.crossFadeTo(onceki, gecis, false); simdiki = onceki } } }) }
      else simdiki = e };
    return { sahne, mix, eylem, oynat, animler: Object.keys(eylem) };
  };
  UC.KARAKTER = ['female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f', 'male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f', 'male-g'].map(x => `model/karakter/character-${x}.glb`);
  UC.ARABA = ['sedan', 'sedan-sports', 'suv', 'suv-luxury', 'hatchback-sports', 'taxi', 'race', 'race-future', 'van', 'police', 'ambulance', 'firetruck', 'delivery', 'truck'].map(x => `model/araba/${x}.glb`);
  // profil fotografli yuvarlak rozet (sprite) + isim etiketi
  UC.rozet = (u, boy = 1) => { const tex = new THREE.CanvasTexture(OY.foto(u, 128)); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    s.scale.set(boy, boy, 1); s.renderOrder = 10; s.guncelle = () => { if (tex.image.surum !== s.ts) { s.ts = tex.image.surum; tex.needsUpdate = true } }; return s };
  UC.etiket = (gen = 2.4) => { const c = document.createElement('canvas'); c.width = 256; c.height = 48; const tex = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); s.scale.set(gen, gen * .19, 1); s.renderOrder = 11; let son = '';
    s.yaz = (yazi, renk = '#fff') => { if (son === yazi + renk) return; son = yazi + renk; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 48); g.fillStyle = 'rgba(0,0,0,.6)';
      g.beginPath(); g.roundRect ? g.roundRect(4, 4, 248, 40, 18) : g.rect(4, 4, 248, 40); g.fill(); g.fillStyle = renk; g.font = 'bold 26px Segoe UI,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(yazi, 128, 25); tex.needsUpdate = true };
    return s };
  UC.yerlestir = async (yol, x, y, z, ry = 0, olcek = 1, sahne) => { const g = await UC.yukle(yol); const m = g.scene.clone(true); m.position.set(x, y, z); m.rotation.y = ry; m.scale.setScalar(olcek); sahne.add(m); return m };
})();
