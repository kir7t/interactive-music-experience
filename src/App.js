// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useRef } from 'react';
import './App.css';
import PianoCanvas from './components/PianoCanvas';
import StarrySkyBackground from './components/StarrySkyBackground'; // 追加

function App() {
  const appHeaderRef = useRef(null);

  return (
    <> {/* Fragmentを使用してStarrySkyBackgroundとメインコンテンツを並列に配置 */}
      <StarrySkyBackground /> {/* 星空背景を一番手前（DOM構造上）に配置 */}
      <div className="App"> {/* メインのアプリケーションコンテンツ */}
        <div className="container">
          <header ref={appHeaderRef}>
            <h1>星屑のピアノ</h1>
            <p>タップまたはクリックして、星に音を奏でよう</p>
          </header>
          <div className="canvas-container">
            <PianoCanvas headerElementRef={appHeaderRef} />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;