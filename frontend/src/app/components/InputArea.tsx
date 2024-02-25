import React from 'react';

const InputArea = ({ onProductChange, value, style  }) => {
  const handleChange = (event) => {
    // 入力値を親コンポーネントに通知する
    onProductChange(event.target.value);
  };
  // フォーム送信の処理をここに記述することもできます
  const handleSubmit = (event) => {
    event.preventDefault(); // フォームのデフォルト送信動作を防ぎます
    // 入力されたPRD_CDを取得するために、event.currentTargetを使用します
    let prdCd = event.currentTarget.elements.namedItem('prd_cd').value.trim();
    
      // 13桁の数字の制限を外して、任意の入力を許可する
    onProductChange(prdCd);
    console.log('Sending PRD_CD:', prdCd); // 実際の送信処理に置き換えてください
  };

 // ボタン専用のスタイルを設定（背景色を含む）
 const buttonStyle = {
  ...style, // Page.tsx から渡されたスタイルを展開
  backgroundColor: '#007bff', // 例: スキャンと同じ色
};

return (
  <div className="px-5 py-5 mx-auto max-w-md text-center">
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
      <div className="text-xl font mb-1" style={{ fontSize: '16px' }}>OR</div>
      <input
        type="text"
        id="prd_cd"
        name="prd_cd"
        value={value}
        onChange={handleChange}
        placeholder="コードを入力"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        style={buttonStyle} // 修正済みスタイルを適用
      >
        検索
      </button>
    </form>
  </div>
);
};

export default InputArea;