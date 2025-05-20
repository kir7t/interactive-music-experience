import React, { useEffect, useRef, useCallback, useState } from 'react';

// --- 音階と色の定義 (1オクターブ + シャープ + 高いド = 13音) ---
const frequencies = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25 // 高いドを追加
};
const notes = Object.keys(frequencies); // 全13音

const baseColors = [ // 13色に調整
    '#87CEFA', '#7AC5CD', '#6495ED', '#5F9EA0', '#ADD8E6', '#B0E0E6', 
    '#AFEEEE', '#E6E6FA', '#D8BFD8', '#DDA0DD', '#CCCCFF', '#C1A7E2',
    '#B3B3FF' // C5用の色を追加 (例)
];
const activeColor = '#FFFFFF';
const attackTime = 0.02;
const decayTime = 0.3;
const sustainLevel = 0.1;
const releaseTime = 0.4;

const PianoCanvas = ({ headerElementRef }) => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const starsRef = useRef([]);
    const particlesRef = useRef([]);
    const staticBgStarsRef = useRef({ stars: [], canvasWidth: 0 });
    const ripplesRef = useRef([]);
    const backgroundEffectsRef = useRef([]);
    const animationFrameIdRef = useRef(null);
    const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);

    const initAudioContext = useCallback(() => { /* ... (変更なし) ... */
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { console.error('Web Audio API not supported:', e); alert('Web Audio API not supported.'); return false; }
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => console.error("AudioContext resume failed:", err));
        }
        const success = audioContextRef.current && audioContextRef.current.state === 'running';
        if (success) setIsAudioContextInitialized(true);
        return success;
    }, []);

    const handleFirstInteraction = useCallback(() => { if (initAudioContext()) { } }, [initAudioContext]);

    useEffect(() => { /* ... (変更なし) ... */
        document.body.addEventListener('click', handleFirstInteraction, { once: true });
        document.body.addEventListener('touchstart', handleFirstInteraction, { once: true });
        return () => {
            document.body.removeEventListener('click', handleFirstInteraction);
            document.body.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, [handleFirstInteraction]);

    const playNote = useCallback((frequency) => { /* ... (変更なし) ... */
        const audioCtx = audioContextRef.current;
        if (!audioCtx || audioCtx.state !== 'running') { if (!initAudioContext()) return; }
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain(); const filterNode = audioCtx.createBiquadFilter();
        oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        filterNode.type = 'lowpass'; filterNode.frequency.setValueAtTime(frequency * 3, audioCtx.currentTime); filterNode.Q.setValueAtTime(1, audioCtx.currentTime);
        const now = audioCtx.currentTime; gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.35, now + attackTime);
        filterNode.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + attackTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(sustainLevel * 0.35, now + attackTime + decayTime);
        gainNode.gain.setTargetAtTime(0, now + attackTime + decayTime, releaseTime / 2.5);
        oscillator.connect(filterNode); filterNode.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.start(now); oscillator.stop(now + attackTime + decayTime + releaseTime + 0.6);
    }, [initAudioContext]);

    const hexToRgba = (hex, alpha) => { /* ... (変更なし) ... */ const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); return `rgba(${r}, ${g}, ${b}, ${alpha})`; };
    const createParticle = useCallback((x, y) => { /* ... (変更なし) ... */ const c = 8 + Math.random()*10; const pN=[]; for(let i=0;i<c;i++)pN.push({x:x,y:y,s:Math.random()*2.8+1.2,vx:(Math.random()-.5)*1.5,vy:Math.random()*1.8+1,o:Math.random()*.7+.5}); particlesRef.current=[...particlesRef.current,...pN]; }, []);
    const createRipple = useCallback((x,y,c)=>{ /* ... (変更なし) ... */ const cv=canvasRef.current;if(!cv)return;const d=window.devicePixelRatio||1;ripplesRef.current.push({x:x,y:y,r:10,mR:(cv.width/d)*.15,c:c,o:.6,lW:3});},[]);
    const createBackgroundEffect = useCallback((x,y,c)=>{ /* ... (変更なし) ... */ const cv=canvasRef.current;if(!cv)return;const d=window.devicePixelRatio||1;backgroundEffectsRef.current.push({x:x,y:y,r:0,mR:Math.max(cv.width/d,cv.height/d)*.8,c:c,o:.15,tO:.02,du:4e3,sT:Date.now()});},[]);

    const createStars = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const computedStyle = getComputedStyle(canvas);
        const logicalWidth = parseFloat(computedStyle.width);
        const logicalHeight = parseFloat(computedStyle.height);

        if (isNaN(logicalWidth) || isNaN(logicalHeight) || logicalWidth === 0 || logicalHeight === 0) {
            return; 
        }
        
        let newStars = []; 
        const MAX_STARS = notes.length; // 13音
        const MIN_STARS_DISPLAY = 7; // 狭い画面での最小表示数を少し増やす（13音あるので）
        
        let starCount;
        const idealStarWidthWithMargin = Math.max(28, logicalWidth / MAX_STARS); 
        
        let calculatedStarCount = Math.floor(logicalWidth / idealStarWidthWithMargin);
        starCount = Math.max(MIN_STARS_DISPLAY, Math.min(calculatedStarCount, MAX_STARS));
        
        if (logicalWidth < MIN_STARS_DISPLAY * 22) { 
             starCount = Math.max(Math.floor(logicalWidth / 28), 5); 
             starCount = Math.min(starCount, MAX_STARS);
        }

        const totalSpacingRatio = 0.04; // 両端の余白をさらに小さく
        const totalSpacing = logicalWidth * totalSpacingRatio;
        const spaceForStars = logicalWidth - totalSpacing;
        
        let baseRadius = (spaceForStars / starCount) / 2.1; // 除数を調整して星を少し大きく、間隔を詰める
        baseRadius = Math.max(9, Math.min(baseRadius, 23)); // 最小半径9px, 最大半径23px

        // Y座標の計算: Canvasの高さの真ん中あたりに星の列が来るようにする
        // または、下部に寄せるが、上部余白を極力なくす
        // const yPos = logicalHeight / 2; // Canvasの垂直方向中央に配置する場合
        // または、より下部に、かつ上部余白を最小限に
        const topPadding = Math.max(5, logicalHeight * 0.05); // 上部の最小パディング
        const bottomPadding = Math.max(5, logicalHeight * 0.05); // 下部の最小パディング
        // 星の直径を考慮してY座標を決定
        // yPos = baseRadius + topPadding; // 上端から配置 (これだと下すぎる)
        // yPos = logicalHeight - baseRadius - bottomPadding; // 下端から配置 (これが基本)

        // Canvasの高さが星の直径 + 上下パディングより大きいことを確認
        if (logicalHeight < (baseRadius * 2 + topPadding + bottomPadding)) {
            // Canvasが狭すぎる場合は、星を中央に配置し、パディングは無視
            // yPos = logicalHeight / 2;
            // または、半径を縮小するなどの対策も考えられる
        }
        // 星の列がCanvasの垂直方向の真ん中より少し下に来るように調整
        // Canvas全体の高さをCSSで制御しているので、yPosはCanvas内部での相対位置
        // Canvasの高さがCSSで固定されているので、その中央に星を配置する
        const yPos = logicalHeight / 2; 
        // もしCanvasが非常に薄い場合（例: 80px）、yPosが40pxになり、半径20pxの星なら中央に来る

        const displayedNotes = notes.slice(0, starCount);
        for(let i=0;i<starCount;i++){ 
            const xP=(spaceForStars/starCount)*(i+.5)+(totalSpacing/2); 
            let cR=baseRadius; 
            if(displayedNotes[i] && displayedNotes[i].includes('#')) { 
                cR*=.80; 
            }
            if (displayedNotes[i] === 'C5') { // 高いドは少し大きくても良いかも
                cR *= 1.05;
            }
            cR=Math.max(7,cR); 
            newStars.push({x:xP,y:yPos,r:cR,bR:cR,c:baseColors[i%baseColors.length],n:displayedNotes[i],iP:!1,aP:0}); 
        }
        starsRef.current = newStars;
    }, []);

    const initBackgroundStars = useCallback(() => { /* ... (変更なし) ... */
        const canvas = canvasRef.current; if (!canvas) return;
        const computedStyle = getComputedStyle(canvas);
        const currentWidth = parseFloat(computedStyle.width);
        const currentHeight = parseFloat(computedStyle.height);
        if (isNaN(currentWidth) || isNaN(currentHeight)) return;

        const numBgStars = Math.floor(currentWidth * currentHeight / 3500); const newBgStars = [];
        for(let i=0;i<Math.max(80,numBgStars);i++)newBgStars.push({x:Math.random()*currentWidth,y:Math.random()*currentHeight,r:Math.random()*1.3+.2,a:Math.random()*.5+.1,tO:Math.random()*Math.PI*2});
        staticBgStarsRef.current = { stars: newBgStars, canvasWidth: currentWidth };
    }, []);

    const setupCanvas = useCallback(() => { /* ... (変更なし) ... */
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const computedStyle = getComputedStyle(canvas);
        const cssWidth = parseFloat(computedStyle.width);
        const cssHeight = parseFloat(computedStyle.height);
        if (isNaN(cssWidth) || isNaN(cssHeight) || cssWidth === 0 || cssHeight === 0) { return; }
        canvas.width = cssWidth * dpr; canvas.height = cssHeight * dpr;
        ctx.scale(dpr, dpr);
        createStars();
        if (staticBgStarsRef.current.stars.length === 0 || staticBgStarsRef.current.canvasWidth !== cssWidth) {
            initBackgroundStars();
        }
    }, [createStars, initBackgroundStars]);

    useEffect(() => { /* ... (描画ループ部分は変更なし) ... */
        const canvas = canvasRef.current; if(!canvas) return; const ctx = canvas.getContext('2d'); if(!ctx) return;
        const drS=(s)=>{ctx.beginPath();const cR=s.bR*(1+s.aP*.2);const gA=s.aP*20+5;ctx.shadowBlur=gA;ctx.shadowColor=s.iP?activeColor:s.c;ctx.arc(s.x,s.y,cR,0,Math.PI*2);ctx.fillStyle=s.iP?activeColor:s.c;ctx.fill();ctx.shadowBlur=0;};
        const drP=()=>{for(let i=particlesRef.current.length-1;i>=0;i--){const p=particlesRef.current[i];ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fillStyle=`rgba(230,230,255,${p.o})`;ctx.fill();p.y-=p.vy;p.x+=p.vx;p.o-=.018;p.s=Math.max(0,p.s-.035);if(p.o<=0||p.s<=0)particlesRef.current.splice(i,1);}};
        const drR=()=>{for(let i=ripplesRef.current.length-1;i>=0;i--){const r=ripplesRef.current[i];ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.strokeStyle=hexToRgba(r.c,r.o);ctx.lineWidth=r.lW;ctx.stroke();r.r+=1.5;r.o-=.01;r.lW=Math.max(.5,r.lW-.05);if(r.o<=0||r.r>r.mR)ripplesRef.current.splice(i,1);}};
        const drBE=()=>{const cT=Date.now();for(let i=backgroundEffectsRef.current.length-1;i>=0;i--){const e=backgroundEffectsRef.current[i];const eT=cT-e.sT;const p=Math.min(eT/e.du,1);e.r=e.mR*Math.pow(p,.5);let cO;if(p<.3)cO=e.o*(p/.3);else cO=e.o*(1-(p-.3)/.7);cO=Math.max(0,cO);ctx.beginPath();const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);g.addColorStop(0,hexToRgba(e.c,cO*.8));g.addColorStop(.7,hexToRgba(e.c,cO*.4));g.addColorStop(1,hexToRgba(e.c,0));ctx.fillStyle=g;ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();if(p>=1)backgroundEffectsRef.current.splice(i,1);}};
        const drBGS=()=>{staticBgStarsRef.current.stars.forEach(s=>{const tF=.6+Math.sin(Date.now()*.0003+s.tO)*.4;ctx.beginPath();ctx.arc(s.x,s.y,s.r*tF,0,Math.PI*2);ctx.fillStyle=`rgba(200,210,255,${s.a*tF})`;ctx.fill();});};
        const draw=()=>{const d=window.devicePixelRatio||1;const cW=canvas.width/d;const cH=canvas.height/d;const gr=ctx.createLinearGradient(0,0,0,cH);gr.addColorStop(0,'#0b0f2a');gr.addColorStop(.5,'#1a1f40');gr.addColorStop(1,'#2a2a5c');ctx.fillStyle=gr;ctx.fillRect(0,0,cW,cH);drBGS();drBE();starsRef.current.forEach(s=>{if(s.iP)s.aP=Math.min(1,s.aP+.15);else s.aP=Math.max(0,s.aP-.07);drS(s);});drR();drP();animationFrameIdRef.current=requestAnimationFrame(draw);};
        setupCanvas(); draw();
        const hR=()=>{setupCanvas();}; window.addEventListener('resize',hR);
        return()=>{cancelAnimationFrame(animationFrameIdRef.current);window.removeEventListener('resize',hR);if(audioContextRef.current&&audioContextRef.current.state==='running'){audioContextRef.current.close().catch(e=>console.error("Error closing AudioContext",e));}};
    }, [setupCanvas]);

    const processInteractionEvent = useCallback((event)=>{ /* ... (変更なし) ... */ const cv=canvasRef.current;if(!cv)return;event.preventDefault();const r=cv.getBoundingClientRect();let cX,cY;if(event.touches&&event.touches.length>0){cX=event.touches[0].clientX;cY=event.touches[0].clientY;}else if(event.clientX!==undefined){cX=event.clientX;cY=event.clientY;}else{return;}const x=(cX-r.left);const y=(cY-r.top);starsRef.current.forEach(s=>{const d=Math.sqrt(Math.pow(x-s.x,2)+Math.pow(y-s.y,2));if(d<s.bR*1.7){if(frequencies[s.n]){playNote(frequencies[s.n]);s.iP=!0;s.aP=0;createParticle(s.x,s.y-s.bR);createRipple(s.x,s.y,s.c);createBackgroundEffect(s.x,s.y,s.c);setTimeout(()=>{s.iP=!1;},120);}}});},[playNote,createParticle,createRipple,createBackgroundEffect]);
    const handleInteraction = useCallback((event)=>{ /* ... (変更なし) ... */ if(!audioContextRef.current&&!initAudioContext())return;if(audioContextRef.current&&audioContextRef.current.state==='suspended'){audioContextRef.current.resume().then(()=>{processInteractionEvent(event);}).catch(err=>console.error("AudioContext resume failed on interaction:",err));}else if(audioContextRef.current&&audioContextRef.current.state==='running'){processInteractionEvent(event);}else{if(initAudioContext())processInteractionEvent(event);}},[initAudioContext,processInteractionEvent]);

    useEffect(() => { /* ... (変更なし) ... */
        const canvas = canvasRef.current; if(!canvas) return;
        canvas.addEventListener('click', handleInteraction);
        canvas.addEventListener('touchstart', handleInteraction, { passive: false });
        return () => {
            canvas.removeEventListener('click', handleInteraction);
            canvas.removeEventListener('touchstart', handleInteraction);
        };
    }, [handleInteraction]);

    return (
        <canvas ref={canvasRef} id="pianoCanvasComponent" style={{touchAction: 'none'}}></canvas>
    );
};

export default PianoCanvas;