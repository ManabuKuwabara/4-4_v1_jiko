'use client';
import React, { useState } from 'react';
import TitleBar from './components/TitleBar';
import InputArea from './components/InputArea';
import OutputArea from './components/OutputArea';
import BarcodeScanner from './components/BarcodeScanner';

// 型定義
type Producttype = {
  PRD_CD: string;
};

export default function Home() {
  const [productcd, setProductCd] = useState<Producttype>({ PRD_CD: "" });
  const [isActive, setIsActive] = useState(false);

  const handleProductChange = (newProductCd: string) => {
    setProductCd({ PRD_CD: newProductCd });
    setIsActive(false); // スキャンが完了したらスキャナーを非アクティブ化
  };

  const resetProductCd = () => {
    setProductCd({ PRD_CD: "" });
  };

  const toggleScanner = () => {
    setIsActive(!isActive); // スキャナーの状態を切り替える
  };

  // 共通ボタンスタイル
  const commonButtonStyle = {
    color: 'white', // テキストの色
    padding: '10px 20px', // パディング
    borderRadius: '5px', // ボーダーの角の丸み
    border: 'none', // ボーダーを非表示
    cursor: 'pointer', // カーソルをポインターに
    margin: '10px 0', // マージン
    width: '400px', // 幅
    maxWidth: '400px', // 最大幅
    display: 'block', // ブロック表示
    marginLeft: 'auto', // 左マージン自動
    marginRight: 'auto' // 右マージン自動
  };

  return (
    <>
      <TitleBar />
      <div className="flex flex-col items-center my-10">
        <button
          onClick={toggleScanner}
          style={{ ...commonButtonStyle, backgroundColor: '#007bff' }} // スキャンボタンに青色を適用
        >
          {isActive ? 'スキャンを停止' : 'スキャンを開始'}
        </button>
        {isActive && <BarcodeScanner onDetected={handleProductChange} isActive={isActive} />}
        <InputArea
          onProductChange={handleProductChange}
          value={productcd.PRD_CD}
          style={commonButtonStyle} // InputAreaに共通スタイルを渡す
        />
        <OutputArea
          productcd={productcd}
          onReset={resetProductCd}
          style={commonButtonStyle} // OutputAreaに共通スタイルを渡す
        />
      </div>
    </>
  );
}
