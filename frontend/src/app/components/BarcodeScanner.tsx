import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = ({ onDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let reader: BrowserMultiFormatReader;

    async function initBarcodeScanner() {
      reader = new BrowserMultiFormatReader();

      try {
        // カメラの映像を取得してビデオ要素に表示
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // バーコードをデコードする
        reader.decodeFromVideoElement(videoRef.current, (result, error, controls) => {
          if (result) {
            // バーコードが検出された場合、コールバックを呼び出す
            onDetected(result);
          }
          // エラー処理や結果が得られなかった場合の処理はここに書く
        });
      } catch (error) {
        console.error("カメラアクセスエラー:",error);
      }
    }

    if (isActive) {
      initBarcodeScanner();
    }

    return () => {
      // コンポーネントのアンマウント時にリソースを解放
      if (reader) {
        reader.reset();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onDetected, isActive]);

  return <video ref={videoRef} style={{ width: '20%', height: 'auto' }} />;
};

export default BarcodeScanner;
