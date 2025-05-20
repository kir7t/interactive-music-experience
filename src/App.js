import React, { useRef, useState, useCallback } from 'react';
import './App.css'; // Appコンポーネント用のスタイル
import PianoCanvas from './components/PianoCanvas';
import StarrySkyBackground from './components/StarrySkyBackground';

// src/App.js

// ... (importや他のコードはそのまま) ...

function App() {
  const appHeaderRef = useRef(null);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);

  const handlePlayButtonClick = useCallback(() => {
    setIsPlayingMelody(prev => !prev);
  }, []);

  const handleMelodyEnd = useCallback(() => {
    setIsPlayingMelody(false);
  }, []);

  return (
    <>
      <StarrySkyBackground />
      <div className="App">
        <div className="container">
          <header ref={appHeaderRef}>
            <h1>星屑のピアノ</h1>
            <p>タップまたはクリックして、星に音を奏でよう</p>
            {/* ↓↓↓ ここが再生ボタンです ↓↓↓ */}
            <button onClick={handlePlayButtonClick} className="play-melody-button">
              {/* ボタンのアイコンとテキストを工夫 */}
              <span role="img" aria-label="play-icon" className="button-icon">
                {isPlayingMelody ? '❚❚' : '▶'} {/* 再生/停止アイコン */}
              </span>
              {isPlayingMelody ? "演奏停止" : "きらきら星"}
            </button>
          </header>
          <div className="canvas-container">
            <PianoCanvas 
              headerElementRef={appHeaderRef} 
              onPlayMelody={isPlayingMelody}
              onMelodyEnd={handleMelodyEnd}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;