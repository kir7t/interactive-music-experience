import React, { useEffect, useRef } from 'react';
import './StarrySkyBackground.css'; // 専用のCSSファイルを読み込む

const StarrySkyBackground = () => {
    const skyRef = useRef(null);

    useEffect(() => {
        const skyElement = skyRef.current;
        if (!skyElement) return;

        // 既存の星をクリア（再レンダリング時に重複しないように）
        while (skyElement.firstChild) {
            skyElement.removeChild(skyElement.firstChild);
        }

        const numberOfStars = 700; // 星の数を調整 (元の1000は多すぎる可能性)

        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement("div");
            star.classList.add("star"); // CSSクラスを適用

            // ランダムな値を設定
            const x = Math.random() * 100; // 画面全体に広がるように % の最大値を100に
            const y = Math.random() * 100; // 画面全体に広がるように % の最大値を100に
            const d = Math.random() * 3 + 0.5; // 星のサイズ (0.5pxから3.5px)
            const s = Math.random() * 3 + 2;   // アニメーション時間 (2sから5s)

            star.style.width = `${d}px`;
            star.style.height = `${d}px`;
            star.style.top = `${y}%`;
            star.style.left = `${x}%`;
            star.style.animationDuration = `${s}s`;
            // アニメーションの遅延をランダムに設定して、一斉に瞬かないようにする
            star.style.animationDelay = `${Math.random() * s}s`;


            skyElement.appendChild(star);
        }

        // クリーンアップ関数は不要 (DOM要素はコンポーネントのアンマウント時に自動的に削除される)
    }, []); // 空の依存配列で、マウント時に一度だけ実行

    return <div id="starry_sky_background" ref={skyRef}></div>;
};

export default StarrySkyBackground;