// ============================================
// effects.js v3 — Event-driven, zero async wrapping
//
// Strategy:
//  - Audio unlocked on first user click (browser requirement)
//  - Victory/failure detected via MutationObserver on DOM changes
//  - Spell overlay triggered by btnCheck click (pure visual, non-blocking)
//  - No async wrapping of app.js functions — zero interference
// ============================================

const FX = (() => {

  // ═══════════════════════════════════════════════════════════
  // A — WEB AUDIO  (lazy-init, unlocked on first click)
  // ═══════════════════════════════════════════════════════════
  let _ctx = null;
  let _audioUnlocked = false;

  function unlockAudio() {
    if (_audioUnlocked) return;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Play a silent buffer to satisfy autoplay policy
      const buf = _ctx.createBuffer(1, 1, 22050);
      const src = _ctx.createBufferSource();
      src.buffer = buf;
      src.connect(_ctx.destination);
      src.start(0);
      _audioUnlocked = true;
    } catch (_) {}
  }

  function getCtx() {
    if (!_ctx) unlockAudio();
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  // Core oscillator tone
  function playTone({ type='sine', freq=440, freq2=null, duration=0.3,
    gain=0.15, attack=0.01, decay=0.05, sustain=0.7, release=0.15, delay=0,
    vibrato=0, vibratoRate=5 } = {}) {
    if (!_audioUnlocked) return;
    setTimeout(function() {
      try {
        var ctx = getCtx(); if (!ctx) return;
        var osc = ctx.createOscillator();
        var g   = ctx.createGain();
        var t   = ctx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, t + duration * 0.8);
        // Optional vibrato via LFO
        if (vibrato > 0) {
          var lfo = ctx.createOscillator();
          var lfoG = ctx.createGain();
          lfo.frequency.value = vibratoRate;
          lfoG.gain.value = vibrato;
          lfo.connect(lfoG); lfoG.connect(osc.frequency);
          lfo.start(t); lfo.stop(t + duration + release + 0.1);
        }
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + attack);
        g.gain.linearRampToValueAtTime(gain * sustain, t + attack + decay);
        g.gain.linearRampToValueAtTime(0, t + duration + release);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + duration + release + 0.1);
      } catch (_) {}
    }, delay);
  }

  // Celesta-like bell: two detuned sines for that glockenspiel shimmer
  function playCelesta(freq, gain, duration, delay) {
    playTone({ type:'sine', freq:freq,      gain:gain,      duration:duration, attack:0.005, decay:0.08, sustain:0.3, release:duration*0.7, delay:delay||0 });
    playTone({ type:'sine', freq:freq*2.756,gain:gain*0.4,  duration:duration*0.5, attack:0.005, decay:0.04, sustain:0.1, release:duration*0.4, delay:delay||0 });
  }

  // Organ chord: multiple detuned oscillators like a pipe organ
  function playOrgan(freq, gain, duration, delay) {
    var harmonics = [1, 2, 3, 4, 6];
    var gains     = [1, 0.5, 0.25, 0.12, 0.06];
    harmonics.forEach(function(h, i) {
      playTone({ type:'sine', freq:freq*h, gain:gain*gains[i], duration:duration,
        attack:0.04, decay:0.1, sustain:0.8, release:0.4, delay:delay||0 });
    });
  }

  // Wand swoosh: noise sweep from high to low (or low to high)
  function playWandSwoosh(rising, gain, delay) {
    if (!_audioUnlocked) return;
    setTimeout(function() {
      try {
        var ctx = getCtx(); if (!ctx) return;
        var n   = Math.floor(ctx.sampleRate * 0.4);
        var buf = ctx.createBuffer(1, n, ctx.sampleRate);
        var d   = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        var src = ctx.createBufferSource();
        var flt = ctx.createBiquadFilter();
        var g   = ctx.createGain();
        src.buffer = buf;
        flt.type = 'bandpass'; flt.Q.value = 3;
        flt.frequency.setValueAtTime(rising ? 200 : 3000, ctx.currentTime);
        flt.frequency.exponentialRampToValueAtTime(rising ? 3000 : 200, ctx.currentTime + 0.35);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain||0.08, ctx.currentTime + 0.05);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.38);
        src.connect(flt); flt.connect(g); g.connect(ctx.destination);
        src.start();
      } catch (_) {}
    }, delay||0);
  }

  // ═══════════════════════════════════════════════════════════
  // B — HARRY POTTER THEMED SOUNDS
  //
  // Design notes:
  //  castCharge  — wand charging up (rising swoosh + celesta shimmer)
  //  success     — Hedwig's Theme opening 4 notes (E4 A4 C5 B4)
  //  failure     — dark descending tritone jinx (like Avada Kedavra failing)
  //  wireConnect — celesta ping (like a spell connecting)
  //  toggle      — soft wand tap
  //  gatePlaced  — magical "plonk" (like placing a rune stone)
  //  timerWarn   — clock tower bell toll
  //  timeUp      — dramatic organ descent (Hogwarts doom)
  //  gatePulse   — tiny sparkle chime
  //  transition  — Hogwarts organ chord swell
  //  streakCannon— triumphant fanfare + Hedwig motif
  //  hint        — owl hoot approximation (two-note minor third fall)
  //  ambient     — Hedwig's Theme first phrase, looping softly
  // ═══════════════════════════════════════════════════════════

  // Hedwig's Theme note frequencies (E minor, Williams' iconic motif)
  // Full opening: E4 A4 C5 B4 | G4 E5 D5 | C5 B4 G4 E5 | A4
  var HW = {
    E4:329.63, F4:349.23, G4:392.00, A4:440.00,
    B4:493.88, C5:523.25, D5:587.33, E5:659.25,
    F5:698.46, G5:783.99, A5:880.00,
    Eb4:311.13, Bb4:466.16, Db5:554.37, Gb4:369.99
  };

  const sounds = {

    // Wand charging: rising swoosh + celesta sparkles
    castCharge() {
      playWandSwoosh(true, 0.07, 0);
      playCelesta(HW.E4, 0.06, 0.15, 60);
      playCelesta(HW.A4, 0.06, 0.15, 140);
      playCelesta(HW.C5, 0.07, 0.18, 220);
      playCelesta(HW.E5, 0.08, 0.2,  310);
    },

    // Hedwig's Theme opening 4 notes: E A C B (the iconic "da-da-da-DUM")
    success() {
      // Main melody — celesta timbre
      playCelesta(HW.E4, 0.13, 0.35, 0);
      playCelesta(HW.A4, 0.13, 0.5,  180);
      playCelesta(HW.C5, 0.12, 0.35, 420);
      playCelesta(HW.B4, 0.14, 0.7,  600);
      // Harmony layer underneath
      playOrgan(HW.E4 * 0.5, 0.04, 1.0, 0);
      // Sparkle tail
      playCelesta(HW.E5, 0.06, 0.25, 900);
      playCelesta(HW.G5, 0.05, 0.2,  1020);
      playCelesta(HW.A5, 0.07, 0.3,  1120);
    },

    // Dark jinx backfire: tritone fall + low rumble (Eb → A descending)
    failure() {
      playTone({ type:'sawtooth', freq:HW.Eb4, freq2:HW.A4*0.5, duration:0.5,
        gain:0.1, attack:0.02, decay:0.1, sustain:0.6, release:0.35 });
      playTone({ type:'sawtooth', freq:HW.Bb4, freq2:HW.E4*0.5, duration:0.45,
        gain:0.07, attack:0.01, decay:0.08, sustain:0.5, release:0.3, delay:60 });
      // Low dark rumble
      playTone({ type:'sine', freq:55, freq2:40, duration:0.6,
        gain:0.12, attack:0.03, decay:0.2, sustain:0.4, release:0.35, delay:80 });
    },

    // Spell connection: celesta ping like a rune locking in
    wireConnect() {
      playCelesta(HW.G4, 0.08, 0.18, 0);
    },

    // Wand tap: soft toggle click
    toggle(on) {
      playCelesta(on ? HW.A4 : HW.E4, 0.06, 0.1, 0);
    },

    // Rune stone placed: plonk with low thud
    gatePlaced() {
      playCelesta(HW.C5, 0.09, 0.2, 0);
      playTone({ type:'sine', freq:120, freq2:80, duration:0.15,
        gain:0.07, attack:0.005, decay:0.05, sustain:0.3, release:0.1 });
    },

    // Clock tower single bell toll (low, resonant)
    timerWarn() {
      playOrgan(HW.E4 * 0.5, 0.06, 0.4, 0);
    },

    // Hogwarts doom: descending organ chords like the castle's bells
    timeUp() {
      playOrgan(HW.A4,      0.09, 0.5, 0);
      playOrgan(HW.G4,      0.09, 0.5, 280);
      playOrgan(HW.F4,      0.09, 0.5, 560);
      playOrgan(HW.E4,      0.11, 0.8, 840);
      playOrgan(HW.E4*0.5,  0.08, 1.0, 1100);
    },

    // Tiny sparkle: single high celesta ping
    gatePulse() {
      playCelesta(HW.E5, 0.05, 0.12, 0);
    },

    // Hogwarts swell: organ chord (A minor — Hogwarts' key)
    levelTransition() {
      playOrgan(HW.A4,    0.07, 0.6, 0);
      playOrgan(HW.C5,    0.06, 0.6, 80);
      playOrgan(HW.E5,    0.06, 0.6, 160);
    },

    // Triumphant fanfare: Hedwig's full 8-note phrase
    streakCannon() {
      // E A C B / G E D / Cel sparkle tail
      var melody = [
        {f:HW.E4, d:0},   {f:HW.A4, d:180}, {f:HW.C5, d:360},
        {f:HW.B4, d:520}, {f:HW.G4, d:700}, {f:HW.E5, d:860},
        {f:HW.D5, d:1040}
      ];
      melody.forEach(function(n) { playCelesta(n.f, 0.13, 0.4, n.d); });
      playOrgan(HW.A4*0.5, 0.05, 1.5, 0);
      // Final flourish
      playCelesta(HW.E5, 0.1, 0.35, 1260);
      playCelesta(HW.A5, 0.12, 0.5, 1400);
    },

    // Owl hoot: two-note minor third fall (like Hedwig the owl)
    hint() {
      playTone({ type:'sine', freq:HW.B4, freq2:HW.G4, duration:0.22,
        gain:0.08, attack:0.03, decay:0.05, sustain:0.6, release:0.15, vibrato:8, vibratoRate:6 });
      playTone({ type:'sine', freq:HW.G4, freq2:HW.E4, duration:0.28,
        gain:0.07, attack:0.02, decay:0.05, sustain:0.5, release:0.18, delay:280, vibrato:6, vibratoRate:5 });
    }
  };

  // ═══════════════════════════════════════════════════════════
  // C — PARTICLES
  // ═══════════════════════════════════════════════════════════
  let sparkCanvas = null, sparkCtx = null;
  const particles = [];
  let rafId = null;

  function ensureCanvas() {
    if (sparkCanvas) return;
    sparkCanvas = document.createElement('canvas');
    sparkCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;mix-blend-mode:screen;';
    document.body.appendChild(sparkCanvas);
    resize(); window.addEventListener('resize', resize);
  }
  function resize() {
    if (!sparkCanvas) return;
    sparkCanvas.width = window.innerWidth; sparkCanvas.height = window.innerHeight;
    sparkCtx = sparkCanvas.getContext('2d');
  }

  class Particle {
    constructor(x, y, o={}) {
      this.x=x; this.y=y;
      const a = o.angle ?? Math.random()*Math.PI*2;
      const s = o.speed ?? (2+Math.random()*5);
      this.vx=Math.cos(a)*s; this.vy=Math.sin(a)*s;
      this.life=1; this.decay=o.decay??(0.02+Math.random()*0.04);
      this.size=o.size??(2+Math.random()*4);
      this.color=o.color??`hsl(${260+Math.random()*60},100%,75%)`;
      this.gravity=o.gravity??0.08; this.trail=o.trail??false; this.history=[];
    }
    update() {
      if(this.trail){this.history.push({x:this.x,y:this.y});if(this.history.length>8)this.history.shift();}
      this.x+=this.vx; this.y+=this.vy; this.vy+=this.gravity; this.vx*=0.97;
      this.life-=this.decay; this.size*=0.97;
    }
    draw(ctx) {
      if(this.trail&&this.history.length>1){
        ctx.save(); ctx.beginPath();
        ctx.moveTo(this.history[0].x,this.history[0].y);
        this.history.forEach(p=>ctx.lineTo(p.x,p.y));
        ctx.strokeStyle=this.color; ctx.lineWidth=this.size*0.4; ctx.globalAlpha=this.life*0.3; ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
      ctx.fillStyle=this.color; ctx.globalAlpha=this.life; ctx.fill();
    }
    isDead(){return this.life<=0||this.size<0.3;}
  }

  function tick() {
    if(!sparkCtx)return;
    sparkCtx.clearRect(0,0,sparkCanvas.width,sparkCanvas.height);
    for(let i=particles.length-1;i>=0;i--){
      particles[i].update();
      sparkCtx.save(); particles[i].draw(sparkCtx); sparkCtx.restore();
      if(particles[i].isDead())particles.splice(i,1);
    }
    if(particles.length>0) rafId=requestAnimationFrame(tick);
    else { rafId=null; sparkCtx?.clearRect(0,0,sparkCanvas.width,sparkCanvas.height); }
  }

  function emit(list) {
    ensureCanvas(); list.forEach(p=>particles.push(p));
    if(!rafId) rafId=requestAnimationFrame(tick);
  }

  function sparksAt(cx, cy, count=40, hueMin=260, hueRange=80) {
    const list=[];
    for(let i=0;i<count;i++){
      const hue=hueMin+Math.random()*hueRange;
      list.push(new Particle(cx,cy,{
        speed:3+Math.random()*8, color:`hsl(${hue},100%,${65+Math.random()*20}%)`,
        decay:0.015+Math.random()*0.03, size:2+Math.random()*5, trail:Math.random()>0.5, gravity:0.12
      }));
    }
    emit(list);
  }

  function sparksFromEl(el, count=35) {
    const r=el.getBoundingClientRect();
    sparksAt(r.left+r.width/2, r.top+r.height/2, count);
  }

  function victoryBurst() {
    const cx=window.innerWidth/2, cy=window.innerHeight/2;
    const colors=['#FFD700','#c084fc','#34d399','#60a5fa','#f87171','#fff'];
    const mk=(n,sMax,decay,sizeMax)=>{
      const list=[];
      for(let i=0;i<n;i++){
        const color=colors[Math.floor(Math.random()*colors.length)];
        list.push(new Particle(cx,cy,{speed:2+Math.random()*sMax,color,decay:0.006+Math.random()*decay,size:1.5+Math.random()*sizeMax,trail:Math.random()>0.4,gravity:0.05+Math.random()*0.1}));
      }
      emit(list);
    };
    mk(110,12,0.016,6.5);
    setTimeout(()=>mk(70,9,0.02,5),200);
  }

  function streakBurst() {
    const colors=['#FFD700','#c084fc','#34d399','#f87171','#fff','#fbbf24','#a78bfa'];
    [{x:window.innerWidth*.15,y:window.innerHeight},{x:window.innerWidth*.5,y:window.innerHeight*.95},{x:window.innerWidth*.85,y:window.innerHeight}]
    .forEach((pt,di)=>setTimeout(()=>{
      const list=[];
      for(let i=0;i<90;i++){
        const color=colors[Math.floor(Math.random()*colors.length)];
        list.push(new Particle(pt.x,pt.y,{speed:5+Math.random()*16,color,decay:0.005+Math.random()*0.013,size:2+Math.random()*7,trail:Math.random()>0.35,gravity:0.08,angle:-Math.PI/2+(Math.random()-.5)*Math.PI*.9}));
      }
      emit(list);
    },di*130));
  }

  function screenFlash(color='rgba(139,92,246,0.25)', ms=380) {
    const el=document.createElement('div');
    el.style.cssText=`position:fixed;top:0;left:0;width:100%;height:100%;background:${color};pointer-events:none;z-index:9998;transition:opacity ${ms}ms ease-out;`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),ms+60); });
  }

  function shake(el, intensity, ms) {
    if (!el) return;
    intensity = intensity || 6;
    ms = ms || 380;
    var frames = [];
    for (var i = 0; i <= 10; i++) {
      var d = 1 - i / 10;
      var tx = (Math.random() - 0.5) * intensity * 2 * d;
      var ty = (Math.random() - 0.5) * intensity * d;
      frames.push({ transform: 'translate(' + tx + 'px,' + ty + 'px)' });
    }
    frames.push({ transform: 'translate(0,0)' });
    el.animate(frames, { duration: ms, easing: 'ease-out' });
  }

  function floatingText(el,text,color='#c084fc') {
    const r=el?el.getBoundingClientRect():{left:100,top:100,width:0,height:0};
    const d=document.createElement('div');
    d.textContent=text;
    d.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top}px;color:${color};font-size:1.1em;font-weight:700;pointer-events:none;z-index:10000;text-shadow:0 2px 8px rgba(0,0,0,.5);transform:translateX(-50%);animation:fxFloatUp .85s ease-out forwards;`;
    document.body.appendChild(d); setTimeout(()=>d.remove(),950);
  }

  // ═══════════════════════════════════════════════════════════
  // 1 — WIRE RENDERER PATCH (value-aware glow + traveling dots)
  // ═══════════════════════════════════════════════════════════
  function patchWireRenderer() {
    if(!window.WireRenderer||window.WireRenderer.__fxPatched)return;
    const proto=window.WireRenderer.prototype;

    proto.drawAllWires=function(wires,currentWire){
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      wires.forEach(w=>{
        let val=null;
        try{ if(window.circuitCalculator)val=window.circuitCalculator.calculateAll().allGates.get(w.from.gateId); }catch(_){}
        this.drawEnhancedWire(w.from.x,w.from.y,w.to.x,w.to.y,val);
      });
      if(currentWire)this.drawPreview(currentWire.from.x,currentWire.from.y,currentWire.to.x,currentWire.to.y);
    };

    proto.drawEnhancedWire=function(x1,y1,x2,y2,value){
      const active=value===1;
      const cx=(x1+x2)/2, cy=Math.min(y1,y2)-40;
      this.ctx.save();
      this.ctx.shadowBlur=active?18:6; this.ctx.shadowColor=active?'#34d399':'#4b5563';
      this.ctx.strokeStyle=active?'#22c55e':'#6b7280';
      this.ctx.lineWidth=active?4.5:2.5; this.ctx.lineCap='round';
      this.ctx.beginPath(); this.ctx.moveTo(x1,y1); this.ctx.quadraticCurveTo(cx,cy,x2,y2); this.ctx.stroke();
      if(active){
        this.ctx.shadowBlur=3; this.ctx.strokeStyle='#fff'; this.ctx.lineWidth=1.2; this.ctx.globalAlpha=0.28;
        this.ctx.beginPath(); this.ctx.moveTo(x1,y1); this.ctx.quadraticCurveTo(cx,cy,x2,y2); this.ctx.stroke();
        this.ctx.globalAlpha=1;
      }
      const dotSpeed=active?1100:2600, dotCount=active?5:2, dotR=active?3:1.8;
      this.ctx.shadowBlur=8; this.ctx.fillStyle=active?'#fff':'#9ca3af';
      for(let i=0;i<dotCount;i++){
        const t=((this.animationTime/dotSpeed+i/dotCount)%1);
        const px=Math.pow(1-t,2)*x1+2*(1-t)*t*cx+Math.pow(t,2)*x2;
        const py=Math.pow(1-t,2)*y1+2*(1-t)*t*cy+Math.pow(t,2)*y2;
        this.ctx.globalAlpha=active?.9:.35;
        this.ctx.beginPath(); this.ctx.arc(px,py,dotR,0,Math.PI*2); this.ctx.fill();
      }
      this.ctx.globalAlpha=1; this.ctx.restore();
    };
    window.WireRenderer.__fxPatched=true;
  }

  // ═══════════════════════════════════════════════════════════
  // 2 — TOOLTIPS
  // ═══════════════════════════════════════════════════════════
  const GATE_INFO={
    AND:{title:'AND Gate ⚡',desc:'Output is 1 only when ALL inputs are 1.\nLike needing both keys to open a lock.'},
    OR:{title:'OR Gate 🌟',desc:'Output is 1 when AT LEAST ONE input is 1.\nEither key will work.'},
    NOT:{title:'NOT Gate 🔄',desc:'Reverses the signal.\nInput 1 → Output 0, and vice versa.'},
    XOR:{title:'XOR Gate ✨',desc:'Output is 1 when EXACTLY ONE input is 1.\nBoth same → output 0.'},
    NAND:{title:'NAND Gate',desc:'Opposite of AND. Output is 0 only when all inputs are 1.'},
    NOR:{title:'NOR Gate',desc:'Opposite of OR. Output is 1 only when all inputs are 0.'},
    INPUT:{title:'Magic Input 🔮',desc:'The source of magic! Toggle using the button panel.\n1 = Active, 0 = Inactive.'},
    OUTPUT:{title:'Output Wand 🎯',desc:'Your target. Connect gates here to complete the spell.\nMust match the required value.'},
  };
  let ttEl=null, ttTimer=null;
  function ensureTT(){
    if(ttEl)return;
    ttEl=document.createElement('div'); ttEl.id='fx-tooltip';
    ttEl.style.cssText='position:fixed;z-index:10001;pointer-events:none;background:linear-gradient(135deg,#1e1b4b,#2e1065);border:1px solid rgba(139,92,246,.5);border-radius:10px;padding:10px 14px;color:#e9e9ef;font-size:.82em;line-height:1.55;max-width:230px;box-shadow:0 8px 32px rgba(0,0,0,.55);opacity:0;transition:opacity .18s ease;white-space:pre-line;';
    document.body.appendChild(ttEl);
  }
  function showTT(info,x,y){
    ensureTT();
    ttEl.innerHTML=`<strong style="color:#c084fc;font-size:.95em;">${info.title}</strong><br><span style="color:#a9a9c2;">${info.desc}</span>`;
    ttEl.style.left=(x+16)+'px'; ttEl.style.top=(y-10)+'px'; ttEl.style.opacity='1';
  }
  function hideTT(){if(ttEl)ttEl.style.opacity='0';}

  function attachTooltips(){
    document.addEventListener('mouseover',e=>{
      const gate=e.target.closest('.placed-gate'), btn=e.target.closest('#gatePalette button');
      if(!gate&&!btn)return;
      clearTimeout(ttTimer);
      ttTimer=setTimeout(()=>{
        let type=null;
        if(gate)type=window.gateSystem?.placedGates.find(g=>g.id===gate.dataset.gateId)?.type;
        else type=btn.textContent.replace(/^\+\s*/,'').trim();
        if(GATE_INFO[type])showTT(GATE_INFO[type],e.clientX,e.clientY);
      },420);
    });
    document.addEventListener('mousemove',e=>{
      if(ttEl&&ttEl.style.opacity==='1'){ttEl.style.left=(e.clientX+16)+'px';ttEl.style.top=(e.clientY-10)+'px';}
    });
    document.addEventListener('mouseout',e=>{
      if(e.target.closest('.placed-gate')||e.target.closest('#gatePalette button')){clearTimeout(ttTimer);hideTT();}
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 3 — SPELL CAST OVERLAY  (purely visual, non-blocking)
  // Triggered on btnCheck click. Plays over ~1s then auto-removes.
  // Does NOT delay or wrap checkSolution.
  // ═══════════════════════════════════════════════════════════
  function spellOverlay() {
    const wrap=document.createElement('div');
    wrap.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9990;display:flex;align-items:center;justify-content:center;';
    const cvs=document.createElement('canvas');
    cvs.width=400; cvs.height=400; cvs.style.filter='drop-shadow(0 0 24px #c084fc)';
    wrap.appendChild(cvs); document.body.appendChild(wrap);
    const ctx=cvs.getContext('2d'), RUNES=['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ'];
    let p=0,raf;
    function draw(){
      ctx.clearRect(0,0,400,400);
      const ep=Math.min(p,1);
      // outer ring
      ctx.save(); ctx.strokeStyle=`rgba(192,132,252,${ep})`; ctx.lineWidth=3; ctx.shadowBlur=20; ctx.shadowColor='#c084fc';
      ctx.beginPath(); ctx.arc(200,200,150,-Math.PI/2,-Math.PI/2+Math.PI*2*ep); ctx.stroke(); ctx.restore();
      // inner ring
      ctx.save(); ctx.strokeStyle=`rgba(251,191,36,${ep*.8})`; ctx.lineWidth=2; ctx.shadowBlur=14; ctx.shadowColor='#fbbf24';
      ctx.beginPath(); ctx.arc(200,200,108,Math.PI/2,Math.PI/2+Math.PI*2*ep); ctx.stroke(); ctx.restore();
      // hexagram
      if(ep>.3){
        const fade=Math.min((ep-.3)/.4,1);
        const pts=Array.from({length:6},(_,i)=>{const a=(i/6)*Math.PI*2-Math.PI/2;return{x:200+Math.cos(a)*128,y:200+Math.sin(a)*128};});
        ctx.save(); ctx.strokeStyle=`rgba(167,139,250,${fade*.55})`; ctx.lineWidth=1.5; ctx.shadowBlur=10; ctx.shadowColor='#a78bfa';
        [[0,2,4,0],[1,3,5,1]].forEach(seq=>{ctx.beginPath();seq.forEach((i,idx)=>idx===0?ctx.moveTo(pts[i].x,pts[i].y):ctx.lineTo(pts[i].x,pts[i].y));ctx.stroke();});
        ctx.restore();
      }
      // runes
      if(ep>.5){
        const fade=Math.min((ep-.5)/.3,1);
        ctx.save(); ctx.font='15px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle=`rgba(196,181,253,${fade})`; ctx.shadowBlur=8; ctx.shadowColor='#c084fc';
        RUNES.forEach((r,i)=>{
          const a=(i/RUNES.length)*Math.PI*2+p*2.5;
          ctx.save(); ctx.translate(200+Math.cos(a)*172,200+Math.sin(a)*172); ctx.rotate(a+Math.PI/2); ctx.globalAlpha=fade; ctx.fillText(r,0,0); ctx.restore();
        });
        ctx.restore();
      }
      // glow
      if(ep>.7){
        const fade=Math.min((ep-.7)/.3,1);
        const gr=ctx.createRadialGradient(200,200,0,200,200,55);
        gr.addColorStop(0,`rgba(251,191,36,${fade*.45})`); gr.addColorStop(1,'transparent');
        ctx.save(); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(200,200,55,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
      p+=0.022;
      if(p<1.2) raf=requestAnimationFrame(draw);
      else wrap.animate([{opacity:1},{opacity:0}],{duration:250}).onfinish=()=>wrap.remove();
    }
    raf=requestAnimationFrame(draw);
  }

  // ═══════════════════════════════════════════════════════════
  // 4 — PROGRESSIVE HINTS
  // ═══════════════════════════════════════════════════════════
  let hT1=null,hT2=null,hBanner=null;
  function resetHints(){
    clearTimeout(hT1); clearTimeout(hT2); dismissBanner();
    document.querySelectorAll('.fx-port-hint').forEach(e=>e.classList.remove('fx-port-hint'));
    hT1=setTimeout(()=>{sounds.hint();showBanner('Click an output port (yellow dot) then an input port (blue dot) to connect gates. Every gate must be in the chain!');},90_000);
    hT2=setTimeout(()=>{sounds.hint();showBanner('Unconnected ports highlighted below — connect them all!');highlightPorts();},150_000);
  }
  function dismissBanner(){if(hBanner){hBanner.remove();hBanner=null;}}
  function showBanner(msg){
    dismissBanner();
    hBanner=document.createElement('div');
    hBanner.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1e1b4b,#2e1065);border:1px solid rgba(192,132,252,.5);border-radius:14px;padding:12px 20px;color:#e9e9ef;font-size:.87em;line-height:1.5;z-index:9995;max-width:500px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:fxSlideUp .4s ease-out;';
    hBanner.innerHTML=`<strong style="color:#c084fc;">🧙 Wizard Tip</strong><br>${msg}<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#a78bfa;cursor:pointer;font-size:1.2em;margin-left:10px;">×</button>`;
    document.body.appendChild(hBanner);
    setTimeout(function(){
      if(hBanner){hBanner.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'}).onfinish=function(){dismissBanner();};}
    },13000);
  }
  function highlightPorts(){
    if(!window.wireSystem||!window.gateSystem)return;
    const used=new Set();
    window.wireSystem.wires.forEach(w=>{used.add(w.from.id);used.add(w.to.id);});
    window.gateSystem.getAllPorts().forEach(p=>{if(!used.has(p.id)&&p.element)p.element.classList.add('fx-port-hint');});
    setTimeout(()=>document.querySelectorAll('.fx-port-hint').forEach(e=>e.classList.remove('fx-port-hint')),9_000);
  }

  // ═══════════════════════════════════════════════════════════
  // 5 — AMBIENT MUSIC: Hedwig's Theme (soft celesta loop)
  // Plays the iconic opening phrase quietly in the background
  // ═══════════════════════════════════════════════════════════
  // Hedwig's Theme opening phrase with rhythm (ms offsets)
  // E4(3) A4(1.5) C5(0.5) B4(1) G4(1) E5(3) D5(1.5) C5(0.5) B4(1) A4(1) F5(4.5)...
  var HEDWIG_PHRASE = [
    {f:329.63, t:0,    d:0.55}, // E4  dotted quarter
    {f:440.00, t:600,  d:0.30}, // A4  quarter
    {f:523.25, t:900,  d:0.20}, // C5  eighth
    {f:493.88, t:1050, d:0.30}, // B4  quarter
    {f:392.00, t:1350, d:0.30}, // G4  quarter
    {f:659.25, t:1650, d:0.55}, // E5  dotted quarter
    {f:587.33, t:2250, d:0.30}, // D5  quarter
    {f:523.25, t:2550, d:0.20}, // C5  eighth
    {f:493.88, t:2700, d:0.30}, // B4  quarter
    {f:440.00, t:3000, d:0.30}, // A4  quarter
    {f:698.46, t:3300, d:0.85}, // F5  dotted half (held)
  ];
  var HEDWIG_LOOP_MS = 7200; // pause then repeat

  var musicOn = true, musicTimer = null, musicPlaying = false;

  function playHedwigPhrase() {
    if (!musicOn || !_audioUnlocked) return;
    HEDWIG_PHRASE.forEach(function(n) {
      setTimeout(function() {
        if (!musicOn) return;
        // Celesta timbre at low volume
        playTone({ type:'sine', freq:n.f,       gain:0.022, duration:n.d+0.3, attack:0.02, decay:0.1, sustain:0.25, release:n.d*0.8, delay:0 });
        playTone({ type:'sine', freq:n.f*2.756, gain:0.008, duration:n.d*0.5, attack:0.01, decay:0.05, sustain:0.1, release:n.d*0.4, delay:0 });
        // Very subtle bass note on beat 1 and 4
        if (n.t === 0 || n.t === 1650) {
          playTone({ type:'sine', freq:n.f*0.25, gain:0.012, duration:0.5, attack:0.04, decay:0.15, sustain:0.4, release:0.35 });
        }
      }, n.t);
    });
  }

  function scheduleHarp() {
    playHedwigPhrase();
    musicTimer = setTimeout(scheduleHarp, HEDWIG_LOOP_MS);
  }
  function startMusic() { if (!musicTimer) musicTimer = setTimeout(scheduleHarp, 1200); }
  function stopMusic()  { clearTimeout(musicTimer); musicTimer = null; }

  function addMusicBtn(){
    const nav=document.querySelector('.topnav');
    if(!nav||document.getElementById('fx-music-btn'))return;
    const btn=document.createElement('a');
    btn.id='fx-music-btn'; btn.href='#'; btn.textContent='🎵'; btn.title='Toggle ambient music';
    btn.style.cssText='cursor:pointer;font-size:1em;padding:7px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:inherit;text-decoration:none;margin-left:6px;transition:opacity .2s;';
    btn.onclick=e=>{e.preventDefault();musicOn=!musicOn;btn.style.opacity=musicOn?'1':'.35';musicOn?startMusic():stopMusic();};
    nav.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════
  // 6 — LEVEL TRANSITION
  // ═══════════════════════════════════════════════════════════
  function doTransition(){
    const el=document.createElement('div');
    el.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:9997;background:radial-gradient(ellipse at center,#1e1b4b,#0b0c10);pointer-events:none;opacity:0;transition:opacity .22s ease;display:flex;align-items:center;justify-content:center;';
    const r=document.createElement('div');
    r.textContent='✦ ᚹᛁᚾᚷᚨᚱᛞᛁᚢᛗ ✦';
    r.style.cssText='color:rgba(192,132,252,.65);font-size:1.15em;letter-spacing:.35em;white-space:nowrap;';
    el.appendChild(r); document.body.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.opacity='1'; sounds.levelTransition();
      setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),260);},420);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7 — GATE VALUE PULSE  (MutationObserver watches badge changes)
  // ═══════════════════════════════════════════════════════════
  const prevVals=new Map();
  function watchGateValues(){
    // Re-check every time the circuit display updates (badge DOM changes)
    const obs=new MutationObserver(()=>{
      if(!window.gateSystem||!window.circuitCalculator)return;
      try{
        const res=window.circuitCalculator.calculateAll();
        window.gateSystem.placedGates.forEach(gate=>{
          const val=res.allGates.get(gate.id);
          const prev=prevVals.get(gate.id);
          if(val!==undefined&&prev!==undefined&&val!==prev&&gate.element){
            gate.element.style.setProperty('--fx-pc',val===1?'#22c55e':'#ef4444');
            gate.element.classList.remove('fx-gate-value-pulse');
            void gate.element.offsetWidth;
            gate.element.classList.add('fx-gate-value-pulse');
            if(val===1)sounds.gatePulse();
          }
          if(val!==undefined)prevVals.set(gate.id,val);
        });
      }catch(_){}
    });
    obs.observe(document.getElementById('app')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  }

  // ═══════════════════════════════════════════════════════════
  // 8 — STREAK CANNON
  // ═══════════════════════════════════════════════════════════
  let _streak=parseInt(localStorage.getItem('fx_streak')||'0',10);
  function onWin(){
    _streak++; localStorage.setItem('fx_streak',_streak);
    if(_streak>=3){setTimeout(()=>{streakBurst();sounds.streakCannon();showStreakBadge(_streak);},500);}
  }
  function onReset(){_streak=0;localStorage.setItem('fx_streak','0');}
  function showStreakBadge(n){
    const b=document.createElement('div');
    b.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%) scale(0);background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1c1917;font-weight:800;font-size:1.25em;padding:10px 28px;border-radius:999px;z-index:10002;box-shadow:0 8px 32px rgba(251,191,36,.55);transition:transform .4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;';
    b.textContent=`🔥 ${n}× Streak!`; document.body.appendChild(b);
    requestAnimationFrame(()=>{
      b.style.transform='translateX(-50%) scale(1)';
      setTimeout(()=>{b.style.transform='translateX(-50%) scale(0)';setTimeout(()=>b.remove(),420);},2600);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AMBIENT SPARKLE
  // ═══════════════════════════════════════════════════════════
  let ambTimer=null;
  function startSparks(){
    if(ambTimer)return;
    ambTimer=setInterval(()=>{
      ensureCanvas();
      const hue=Math.random()>.5?260+Math.random()*40:40+Math.random()*20;
      emit([new Particle(Math.random()*window.innerWidth,Math.random()*window.innerHeight,{speed:.4+Math.random()*1.1,color:`hsl(${hue},100%,80%)`,decay:.009+Math.random()*.014,size:1+Math.random()*2.3,gravity:-.01})]);
    },160);
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS(){
    if(document.getElementById('fx-styles'))return;
    const s=document.createElement('style'); s.id='fx-styles';
    s.textContent=`
      @keyframes fxFloatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-46px)}}
      @keyframes fxSlideUp{from{opacity:0;transform:translateX(-50%) translateY(18px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      @keyframes fxGateGlow{0%,100%{filter:drop-shadow(0 0 4px #c084fc)}50%{filter:drop-shadow(0 0 22px #c084fc) drop-shadow(0 0 42px #fbbf24)}}
      .fx-gate-glow{animation:fxGateGlow .65s ease-in-out 4 !important}
      @keyframes fxGatePulse{0%{transform:scale(1);filter:drop-shadow(0 0 0px var(--fx-pc,#22c55e))}40%{transform:scale(1.13);filter:drop-shadow(0 0 16px var(--fx-pc,#22c55e))}100%{transform:scale(1);filter:drop-shadow(0 0 0px var(--fx-pc,#22c55e))}}
      .fx-gate-value-pulse{animation:fxGatePulse .32s ease-out !important}
      #btnCheck.fx-charging{animation:fxBtnCharge .4s ease-in-out infinite alternate}
      @keyframes fxBtnCharge{from{box-shadow:0 0 8px 2px rgba(139,92,246,.5)}to{box-shadow:0 0 24px 10px rgba(251,191,36,.7)}}
      .fx-timer-pulse{animation:fxTimerPulse .5s ease-in-out}
      @keyframes fxTimerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.16)}}
      @keyframes fxPortHint{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0);background:#4a90e2}50%{box-shadow:0 0 0 7px rgba(251,191,36,.55);background:#fbbf24}}
      .fx-port-hint{animation:fxPortHint .9s ease-in-out infinite !important}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // VICTORY / FAILURE DETECTION via MutationObserver
  //
  // Instead of wrapping showVictoryPopup (which caused async bugs),
  // we watch for the victory popup (#victoryPopup) being added to body,
  // and for .error / .success divs in #statusArea.
  // This is 100% non-invasive to app.js.
  // ═══════════════════════════════════════════════════════════
  function watchForGameEvents(){
    const observer=new MutationObserver(mutations=>{
      for(const m of mutations){
        // Victory popup added
        for(const node of m.addedNodes){
          if(node.nodeType!==1)continue;

          // Victory popup
          if(node.id==='victoryPopup'||node.querySelector?.('#victoryPopup')){
            const popup=node.id==='victoryPopup'?node:node.querySelector('#victoryPopup');
            if(popup&&!popup.__fxDone){
              popup.__fxDone=true;
              sounds.success();
              screenFlash('rgba(34,197,94,0.22)');
              victoryBurst();
              document.querySelectorAll('.placed-gate').forEach(g=>{
                g.classList.remove('fx-gate-glow'); void g.offsetWidth; g.classList.add('fx-gate-glow');
              });
              onWin();
              clearTimeout(hT1); clearTimeout(hT2);
            }
          }
        }

        // Status area changes — detect error vs success text
        if(m.target?.id==='statusArea'||m.target?.closest?.('#statusArea')){
          const area=document.getElementById('statusArea');
          if(!area)continue;
          const hasError=area.querySelector('.error');
          const hasSuccess=area.querySelector('.success');
          const key=area.textContent.trim();
          if(hasError&&key&&area.__fxLastKey!==key){
            area.__fxLastKey=key;
            sounds.failure();
            screenFlash('rgba(239,68,68,0.15)');
            shake(document.getElementById('canvasHost'),5);
          } else if(hasSuccess&&key&&area.__fxLastKey!==key){
            area.__fxLastKey=key;
            // minor success sound — full victory is handled by victoryPopup above
          }
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:false});
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN HOOK — called once after DOM is ready
  // ═══════════════════════════════════════════════════════════
  function boot(){
    injectCSS();
    attachTooltips();
    addMusicBtn();
    patchWireRenderer();
    watchForGameEvents();
    watchGateValues();
    startSparks();

    // Hash-change → level transition + hint reset
    window.addEventListener('hashchange',e=>{
      const isPlay=location.hash.startsWith('#play-');
      const wasPlay=(e.oldURL||'').includes('#play-');
      if(isPlay||(wasPlay&&(location.hash.startsWith('#win-')||location.hash.startsWith('#lose-'))))doTransition();
      if(isPlay)resetHints();
    });

    // Click listener — unlock audio on first gesture, then decorative FX
    document.addEventListener('click',e=>{
      // FIRST: unlock audio (runs once, silent)
      if(!_audioUnlocked)unlockAudio();

      // Cast Spell button
      if(e.target.closest('#btnCheck')){
        const btn=e.target.closest('#btnCheck');
        sounds.castCharge();
        sparksFromEl(btn,35);
        btn.animate([
          {boxShadow:'0 0 0 0 rgba(139,92,246,.8)',transform:'scale(1)'},
          {boxShadow:'0 0 20px 12px rgba(139,92,246,0)',transform:'scale(1.08)'},
          {boxShadow:'0 0 0 0 rgba(139,92,246,0)',transform:'scale(1)'}
        ],{duration:600,easing:'ease-out'});
        btn.classList.add('fx-charging');
        setTimeout(()=>btn.classList.remove('fx-charging'),600);
        spellOverlay(); // purely visual, runs alongside checkSolution
        if(document.getElementById('canvasHost'))resetHints();
        // Start music on first meaningful click
        startMusic();
      }

      // Input toggles
      const inputBtn=e.target.closest('[id^="input_"]');
      if(inputBtn){
        sounds.toggle(inputBtn.classList.contains('ok'));
        sparksFromEl(inputBtn,8);
        if(document.getElementById('canvasHost'))resetHints();
      }

      // Gate palette
      const palBtn=e.target.closest('#gatePalette button');
      if(palBtn){sounds.gatePlaced();floatingText(palBtn,'✨ Spell placed!');if(document.getElementById('canvasHost'))resetHints();}

      // Reset
      if(e.target.closest('#btnResetLevel'))onReset();
    });

    // Wire sound
    document.addEventListener('wireCreated',()=>{sounds.wireConnect();if(document.getElementById('canvasHost'))resetHints();},true);

    // Timer warning
    let lastTimerRem=null;
    setInterval(()=>{
      const rem=window.levelTimeRemaining;
      if(rem===undefined||rem===lastTimerRem)return;
      lastTimerRem=rem;
      if(rem>0&&rem<=10){
        const d=document.getElementById('timerDisplay');
        if(d){d.classList.remove('fx-timer-pulse');void d.offsetWidth;d.classList.add('fx-timer-pulse');}
        sounds.timerWarn();
      }
      if(rem<=0)sounds.timeUp();
    },900);
  }

  // ═══════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════
  return {
    sounds, screenFlash, shake, victoryBurst, streakBurst,
    sparksAt, sparksFromEl, floatingText, spellOverlay, doTransition,
    showBanner, highlightPorts, showStreakBadge, startMusic, stopMusic,

    init(){
      injectCSS();
      const go=()=>document.getElementById('app')?boot():setTimeout(go,200);
      document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
    }
  };
})();

FX.init();