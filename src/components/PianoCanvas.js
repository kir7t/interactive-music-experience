import React, { useEffect, useRef, useCallback, useState } from 'react';

// --- 定数定義 ---
const frequencies = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
};
const notes = Object.keys(frequencies);
const baseColors = [ 
    '#87CEFA', '#7AC5CD', '#6495ED', '#5F9EA0', '#ADD8E6', '#B0E0E6', 
    '#AFEEEE', '#E6E6FA', '#D8BFD8', '#DDA0DD', '#CCCCFF', '#C1A7E2',
    '#B3B3FF' 
];
const activeColor = '#FFFFFF';
const attackTime = 0.02; const decayTime = 0.3; const sustainLevel = 0.1; const releaseTime = 0.4;

const twinkleTwinkleMelody = [
    { note: 'C4', duration: 400 }, { note: 'C4', duration: 400 }, { note: 'G4', duration: 400 }, { note: 'G4', duration: 400 },
    { note: 'A4', duration: 400 }, { note: 'A4', duration: 400 }, { note: 'G4', duration: 800 },
    { note: 'F4', duration: 400 }, { note: 'F4', duration: 400 }, { note: 'E4', duration: 400 }, { note: 'E4', duration: 400 },
    { note: 'D4', duration: 400 }, { note: 'D4', duration: 400 }, { note: 'C4', duration: 800 },
    { note: 'G4', duration: 400 }, { note: 'G4', duration: 400 }, { note: 'F4', duration: 400 }, { note: 'F4', duration: 400 },
    { note: 'E4', duration: 400 }, { note: 'E4', duration: 400 }, { note: 'D4', duration: 800 },
    { note: 'G4', duration: 400 }, { note: 'G4', duration: 400 }, { note: 'F4', duration: 400 }, { note: 'F4', duration: 400 },
    { note: 'E4', duration: 400 }, { note: 'E4', duration: 400 }, { note: 'D4', duration: 800 },
    { note: 'C4', duration: 400 }, { note: 'C4', duration: 400 }, { note: 'G4', duration: 400 }, { note: 'G4', duration: 400 },
    { note: 'A4', duration: 400 }, { note: 'A4', duration: 400 }, { note: 'G4', duration: 800 },
    { note: 'F4', duration: 400 }, { note: 'F4', duration: 400 }, { note: 'E4', duration: 400 }, { note: 'E4', duration: 400 },
    { note: 'D4', duration: 400 }, { note: 'D4', duration: 400 }, { note: 'C4', duration: 800 },
];
// --- 定数定義ここまで ---

const PianoCanvas = ({ headerElementRef, onPlayMelody, onMelodyEnd }) => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const starsRef = useRef([]);
    const particlesRef = useRef([]);
    const staticBgStarsRef = useRef({ stars: [], canvasWidth: 0, canvasHeight: 0 }); // canvasHeightも追加
    const ripplesRef = useRef([]);
    const backgroundEffectsRef = useRef([]);
    const animationFrameIdRef = useRef(null);
    const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);
    const autoPlayTimeoutRef = useRef(null);
    const isPlayingMelodyRef = useRef(false);

    const initAudioContext = useCallback(async () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { console.error('Web Audio API not supported:', e); alert('Web Audio API not supported.'); return false; }
        }
        if (audioContextRef.current.state === 'suspended') {
            try {
                await audioContextRef.current.resume();
                setIsAudioContextInitialized(true);
                return true;
            } catch (err) {
                console.error("AudioContext resume failed:", err);
                return false;
            }
        }
        const success = audioContextRef.current && audioContextRef.current.state === 'running';
        if (success) setIsAudioContextInitialized(true);
        return success;
    }, []);

    const handleFirstInteraction = useCallback(async () => {
        await initAudioContext();
    }, [initAudioContext]);

    useEffect(() => {
        document.body.addEventListener('click', handleFirstInteraction, { once: true });
        document.body.addEventListener('touchstart', handleFirstInteraction, { once: true });
        return () => {
            document.body.removeEventListener('click', handleFirstInteraction);
            document.body.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, [handleFirstInteraction]);

    const playNoteSound = useCallback(async (frequency) => {
        if (!isAudioContextInitialized) {
            const ready = await initAudioContext();
            if (!ready) return;
        }
        const audioCtx = audioContextRef.current;
        if (!audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator(), gn=audioCtx.createGain(), fn=audioCtx.createBiquadFilter();
        osc.type='triangle'; osc.frequency.setValueAtTime(frequency,audioCtx.currentTime);
        fn.type='lowpass';fn.frequency.setValueAtTime(frequency*3,audioCtx.currentTime);fn.Q.setValueAtTime(1,audioCtx.currentTime);
        const n=audioCtx.currentTime;gn.gain.setValueAtTime(0,n);gn.gain.linearRampToValueAtTime(.35,n+attackTime);
        fn.frequency.exponentialRampToValueAtTime(frequency*1.2,n+attackTime+.1);
        gn.gain.exponentialRampToValueAtTime(sustainLevel*.35,n+attackTime+decayTime);
        gn.gain.setTargetAtTime(0,n+attackTime+decayTime,releaseTime/2.5);
        osc.connect(fn);fn.connect(gn);gn.connect(audioCtx.destination);
        osc.start(n);osc.stop(n+attackTime+decayTime+releaseTime+.6);
    }, [initAudioContext, isAudioContextInitialized]);

    const hexToRgba=(h,a)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;};
    const createParticle=useCallback((x,y)=>{const c=8+Math.random()*10,pN=[];for(let i=0;i<c;i++)pN.push({x:x,y:y,s:Math.random()*2.8+1.2,vx:(Math.random()-.5)*1.5,vy:Math.random()*1.8+1,o:Math.random()*.7+.5});particlesRef.current=[...particlesRef.current,...pN];},[]);
    const createRipple=useCallback((x,y,c)=>{const cv=canvasRef.current;if(!cv)return;const d=window.devicePixelRatio||1;ripplesRef.current.push({x:x,y:y,r:10,mR:(cv.width/d)*.15,c:c,o:.6,lW:3});},[]);
    const createBackgroundEffect=useCallback((x,y,c)=>{const cv=canvasRef.current;if(!cv)return;const d=window.devicePixelRatio||1;backgroundEffectsRef.current.push({x:x,y:y,r:0,mR:Math.max(cv.width/d,cv.height/d)*.8,c:c,o:.15,tO:.02,du:4e3,sT:Date.now()});},[]);

    const activateStar = useCallback((noteName) => {
        const starToActivate = starsRef.current.find(star => star.n === noteName);
        if (starToActivate) {
            starToActivate.iP=true;starToActivate.aP=0;
            createParticle(starToActivate.x,starToActivate.y-starToActivate.bR);
            createRipple(starToActivate.x,starToActivate.y,starToActivate.c);
            createBackgroundEffect(starToActivate.x,starToActivate.y,starToActivate.c);
            setTimeout(()=>{starToActivate.iP=false;},150);
        }
    }, [createParticle, createRipple, createBackgroundEffect]);

    const playMelody = useCallback(async (melody) => {
        if(isPlayingMelodyRef.current)return;isPlayingMelodyRef.current=true;
        if(!isAudioContextInitialized){const r=await initAudioContext();if(!r){alert("オーディオの準備ができませんでした。ページをリロードするか、一度画面をクリック/タップしてみてください。");isPlayingMelodyRef.current=false;if(onMelodyEnd)onMelodyEnd();return;}}
        clearTimeout(autoPlayTimeoutRef.current);
        for(let i=0;i<melody.length;i++){if(!isPlayingMelodyRef.current)break;const it=melody[i];if(frequencies[it.note]){await playNoteSound(frequencies[it.note]);activateStar(it.note);}await new Promise(rs=>{autoPlayTimeoutRef.current=setTimeout(rs,it.duration*.9);});}
        isPlayingMelodyRef.current=false;if(onMelodyEnd)onMelodyEnd();
    }, [initAudioContext, playNoteSound, activateStar, isAudioContextInitialized, onMelodyEnd]);

    useEffect(() => {
        if(onPlayMelody){playMelody(twinkleTwinkleMelody);}
        else{clearTimeout(autoPlayTimeoutRef.current);isPlayingMelodyRef.current=false;}
    }, [onPlayMelody, playMelody]);

    const createStars = useCallback(() => {
        const canvas=canvasRef.current;if(!canvas)return;
        const computedStyle=getComputedStyle(canvas);
        let logicalWidth=parseFloat(computedStyle.width);
        let logicalHeight=parseFloat(computedStyle.height);

        if(isNaN(logicalWidth)||isNaN(logicalHeight)||logicalWidth<=0||logicalHeight<=0){
            logicalWidth = staticBgStarsRef.current.canvasWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 300);
            logicalHeight = staticBgStarsRef.current.canvasHeight || logicalWidth * 0.25; // 保持した高さかデフォルト比率
            if (logicalHeight <= 0) logicalHeight = 80; // 最終フォールバック
             // console.log("Fallback canvas size:", logicalWidth, logicalHeight);
        }
        
        let newStars=[];const MAX_STARS=notes.length;const MIN_STARS_DISPLAY=Math.min(7,MAX_STARS);
        let starCount;const idealStarWidthWithMargin=Math.max(25,logicalWidth/MAX_STARS);
        let calculatedStarCount=Math.floor(logicalWidth/idealStarWidthWithMargin);
        starCount=Math.max(MIN_STARS_DISPLAY,Math.min(calculatedStarCount,MAX_STARS));
        if(logicalWidth<MIN_STARS_DISPLAY*20){starCount=Math.max(Math.floor(logicalWidth/25),Math.min(4,MAX_STARS));starCount=Math.min(starCount,MAX_STARS);}
        const totalSpacingRatio=.03;const totalSpacing=logicalWidth*totalSpacingRatio;const spaceForStars=logicalWidth-totalSpacing;
        let baseRadius=(spaceForStars/starCount)/2;baseRadius=Math.max(10,Math.min(baseRadius,Math.min(28,logicalHeight*.35)));
        const yPos=logicalHeight/2;
        const displayedNotes=notes.slice(0,starCount);
        for(let i=0;i<starCount;i++){const xP=(spaceForStars/starCount)*(i+.5)+(totalSpacing/2);let cR=baseRadius;if(displayedNotes[i]&&displayedNotes[i].includes('#'))cR*=.75;if(displayedNotes[i]==='C5')cR*=1;cR=Math.max(8,cR);newStars.push({x:xP,y:yPos,r:cR,bR:cR,c:baseColors[i%baseColors.length],n:displayedNotes[i],iP:!1,aP:0});}
        starsRef.current=newStars;
    }, []);

    const initBackgroundStars = useCallback(() => {
        const canvas=canvasRef.current;if(!canvas)return;
        const computedStyle=getComputedStyle(canvas);
        let currentWidth=parseFloat(computedStyle.width);
        let currentHeight=parseFloat(computedStyle.height);
        if(isNaN(currentWidth)||isNaN(currentHeight)||currentWidth<=0||currentHeight<=0){currentWidth=staticBgStarsRef.current.canvasWidth||300;currentHeight=staticBgStarsRef.current.canvasHeight||80;}
        staticBgStarsRef.current.canvasWidth = currentWidth; // サイズを保持
        staticBgStarsRef.current.canvasHeight = currentHeight;

        const numBgStars=Math.floor(currentWidth*currentHeight/3500);const nS=[];
        for(let i=0;i<Math.max(80,numBgStars);i++)nS.push({x:Math.random()*currentWidth,y:Math.random()*currentHeight,r:Math.random()*1.3+.2,a:Math.random()*.5+.1,tO:Math.random()*Math.PI*2});
        staticBgStarsRef.current.stars=nS;
    }, []);

    const setupCanvas = useCallback(() => {
        const canvas=canvasRef.current;if(!canvas)return;
        const ctx=canvas.getContext('2d');if(!ctx)return;
        const dpr=window.devicePixelRatio||1;
        const computedStyle=getComputedStyle(canvas);
        const cssWidth=parseFloat(computedStyle.width);
        const cssHeight=parseFloat(computedStyle.height);

        if(isNaN(cssWidth)||isNaN(cssHeight)||cssWidth<=0||cssHeight<=0){
            // console.warn("setupCanvas: Invalid CSS dimensions. Will rely on resize or next frame.");
            return; // サイズがまだ確定していない場合は描画を試みない
        }
        
        canvas.width=cssWidth*dpr;canvas.height=cssHeight*dpr;
        ctx.scale(dpr,dpr);
        
        createStars();
        if(staticBgStarsRef.current.stars.length===0||staticBgStarsRef.current.canvasWidth!==cssWidth||staticBgStarsRef.current.canvasHeight!==cssHeight){
            initBackgroundStars();
        }
    }, [createStars, initBackgroundStars]);

    useEffect(() => {
        setupCanvas();
        const handleResize = () => setupCanvas();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvas]);

    useEffect(() => {
        const canvas=canvasRef.current;if(!canvas)return;
        const ctx=canvas.getContext('2d');if(!ctx)return;
        let isActive=true;
        const drS=(s)=>{ctx.beginPath();const cR=s.bR*(1+s.aP*.2);const gA=s.aP*20+5;ctx.shadowBlur=gA;ctx.shadowColor=s.iP?activeColor:s.c;ctx.arc(s.x,s.y,cR,0,Math.PI*2);ctx.fillStyle=s.iP?activeColor:s.c;ctx.fill();ctx.shadowBlur=0;};
        const drP=()=>{for(let i=particlesRef.current.length-1;i>=0;i--){const p=particlesRef.current[i];ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fillStyle=`rgba(230,230,255,${p.o})`;ctx.fill();p.y-=p.vy;p.x+=p.vx;p.o-=.018;p.s=Math.max(0,p.s-.035);if(p.o<=0||p.s<=0)particlesRef.current.splice(i,1);}};
        const drR=()=>{for(let i=ripplesRef.current.length-1;i>=0;i--){const r=ripplesRef.current[i];ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.strokeStyle=hexToRgba(r.c,r.o);ctx.lineWidth=r.lW;ctx.stroke();r.r+=1.5;r.o-=.01;r.lW=Math.max(.5,r.lW-.05);if(r.o<=0||r.r>r.mR)ripplesRef.current.splice(i,1);}};
        const drBE=()=>{const cT=Date.now();for(let i=backgroundEffectsRef.current.length-1;i>=0;i--){const e=backgroundEffectsRef.current[i];const eT=cT-e.sT;const p=Math.min(eT/e.du,1);e.r=e.mR*Math.pow(p,.5);let cO;if(p<.3)cO=e.o*(p/.3);else cO=e.o*(1-(p-.3)/.7);cO=Math.max(0,cO);ctx.beginPath();const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);g.addColorStop(0,hexToRgba(e.c,cO*.8));g.addColorStop(.7,hexToRgba(e.c,cO*.4));g.addColorStop(1,hexToRgba(e.c,0));ctx.fillStyle=g;ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();if(p>=1)backgroundEffectsRef.current.splice(i,1);}};
        const drBGS=()=>{if(staticBgStarsRef.current.stars.length>0)staticBgStarsRef.current.stars.forEach(s=>{const tF=.6+Math.sin(Date.now()*.0003+s.tO)*.4;ctx.beginPath();ctx.arc(s.x,s.y,s.r*tF,0,Math.PI*2);ctx.fillStyle=`rgba(200,210,255,${s.a*tF})`;ctx.fill();});};
        
        const draw=()=>{
            if(!isActive)return;
            const dpr=window.devicePixelRatio||1;
            const logicalWidth=canvas.width/dpr;
            const logicalHeight=canvas.height/dpr;
            if(logicalWidth<=0||logicalHeight<=0){animationFrameIdRef.current=requestAnimationFrame(draw);return;}
            const grad=ctx.createLinearGradient(0,0,0,logicalHeight);grad.addColorStop(0,'#0b0f2a');grad.addColorStop(.5,'#1a1f40');grad.addColorStop(1,'#2a2a5c');ctx.fillStyle=grad;ctx.fillRect(0,0,logicalWidth,logicalHeight);
            drBGS();drBE();
            if(starsRef.current.length > 0){ // 星が生成されていれば描画
                 starsRef.current.forEach(s=>{if(s.iP)s.aP=Math.min(1,s.aP+.15);else s.aP=Math.max(0,s.aP-.07);drS(s);});
            }
            drR();drP();
            animationFrameIdRef.current=requestAnimationFrame(draw);
        };

        if(canvas.width > 0 && canvas.height > 0) { // 物理サイズが設定されていれば描画開始
            draw();
        } else {
            // 最初のsetupCanvas呼び出しでサイズが確定しなかった場合、
            // リサイズハンドラや次のフレームでのsetupCanvas呼び出しを待つ。
            // 確実性を高めるため、ここでも一度setupCanvasを試みる（ただし無限ループに注意）
            // console.log("Canvas not ready, attempting setup again for drawing");
            // setupCanvas(); // これが無限ループを引き起こす可能性があるのでコメントアウト。リサイズや初期のuseEffectでカバーする。
        }

        return()=>{
            isActive=false;
            cancelAnimationFrame(animationFrameIdRef.current);
            if(audioContextRef.current&&audioContextRef.current.state==='running'){audioContextRef.current.close().catch(e=>console.error("AC close error",e));}
        };
    }, [setupCanvas]); // setupCanvas を依存に追加して、それが更新されたら描画ループも再起動

    const processInteractionEvent=useCallback((e)=>{const cv=canvasRef.current;if(!cv)return;e.preventDefault();const r=cv.getBoundingClientRect();let cX,cY;if(e.touches&&e.touches.length>0){cX=e.touches[0].clientX;cY=e.touches[0].clientY;}else if(e.clientX!==void 0){cX=e.clientX;cY=e.clientY;}else return;const x=cX-r.left,y=cY-r.top;starsRef.current.forEach(s=>{const d=Math.sqrt(Math.pow(x-s.x,2)+Math.pow(y-s.y,2));if(d<s.bR*1.7&&frequencies[s.n]){playNoteSound(frequencies[s.n]);activateStar(s.n);}});},[playNoteSound,activateStar]);
    const handleInteraction=useCallback(async e=>{if(!isAudioContextInitialized){const रेडी=await initAudioContext();if(!रेडी)return;}if(audioContextRef.current&&audioContextRef.current.state==='running')processInteractionEvent(e);},[initAudioContext,processInteractionEvent,isAudioContextInitialized]);
    useEffect(()=>{const cv=canvasRef.current;if(!cv)return;cv.addEventListener('click',handleInteraction);cv.addEventListener('touchstart',handleInteraction,{passive:!1});return()=>{cv.removeEventListener('click',handleInteraction);cv.removeEventListener('touchstart',handleInteraction);};},[handleInteraction]);

    return (
        <canvas ref={canvasRef} id="pianoCanvasComponent" style={{touchAction: 'none'}}></canvas>
    );
};

export default PianoCanvas;