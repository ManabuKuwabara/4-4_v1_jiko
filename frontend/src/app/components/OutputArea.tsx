import React, { useState, useEffect } from 'react';

const OutputArea = ({ productcd, onReset, style  }) => {
  const [data, setData] = useState(null);
  const [purchaseList, setPurchaseList] = useState([]);
  const [taxRate, setTaxRate] = useState(0.1); // デフォルト税率を設定
  const [totalWithTax, setTotalWithTax] = useState(0);
  const [totalWithoutTax, setTotalWithoutTax] = useState(0);
  const [errorOccurred, setErrorOccurred] = useState(false); // エラーが発生したかどうかを管理する状態

  useEffect(() => {
    const fetchData = async () => {
      if (productcd.PRD_CD) {
        try {
          const response = await fetch('http://127.0.0.1:8000/search_product/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: productcd.PRD_CD }),
          });
          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.detail || '不明なエラーが発生しました');
          }
          const result = await response.json();
          setData(result);
        } catch (error) {
          console.error('データの取得に失敗しました', error);
          setData({ status: 'failed', message: error.message });
        }
      }
    };

    fetchData();
  }, [productcd]);

  useEffect(() => {
    const fetchDefaultTaxRate = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/tax/');
        if (!response.ok) {
          throw new Error('税率の取得に失敗しました');
        }
        const taxData = await response.json();
        const defaultTax = taxData.find(tax => tax.CODE === 10); // デフォルトの税率を取得
        if (defaultTax) {
          setTaxRate(defaultTax.PERCENT);
        } else {
          throw new Error('デフォルトの税率が見つかりません');
        }
      } catch (error) {
        console.error(error);
        setErrorOccurred(true); // エラーが発生したことを示すフラグを立てる
      }
    };

    fetchDefaultTaxRate();
  }, []);

  const handleAddToPurchaseList = () => {
    if (data && data.status === 'success') {
      const existingItem = purchaseList.find(item => item.PRD_ID === data.message.PRD_ID);
      if (existingItem) {
        setPurchaseList(purchaseList.map(item =>
          item.PRD_ID === data.message.PRD_ID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setPurchaseList([...purchaseList, { ...data.message, quantity: 1 }]);
      }
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const newPurchaseList = [...purchaseList];
    if (newQuantity === 0) {
      newPurchaseList.splice(index, 1); // 数量が0の場合はリストから削除
    } else {
      newPurchaseList[index].quantity = newQuantity;
    }
    setPurchaseList(newPurchaseList);
  };

  const calculateTotal = (includeTax) => {
    const subtotal = purchaseList.reduce((total, item) => total + item.PRD_PRICE * item.quantity, 0);
    return includeTax ? Math.round(subtotal * (1 + taxRate)) : subtotal;
  };

  useEffect(() => {
    setTotalWithTax(calculateTotal(true));
    setTotalWithoutTax(calculateTotal(false));
  }, [purchaseList, taxRate]);

  const handlePurchase = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: purchaseList, totalWithTax, totalWithoutTax }),
      });
      if (!response.ok) {
        throw new Error('購入処理に失敗しました');
      }
      const result = await response.json();
      console.log(result);
      alert('購入が完了しました');
    // 購入リストと商品情報をクリア
    setPurchaseList([]);
    setData(null);  // 商品情報をクリア
    // 購入が成功したら、親コンポーネントのリセット関数を呼び出して商品コードをクリアします
    onReset();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

  // 「追加」ボタン専用スタイル
  const addButtonStyle = {
    ...style, // 共通スタイルを展開
    backgroundColor: '#4CAF50', // 追加ボタンの背景色
  };

  // 「購入」ボタン専用スタイル
  const purchaseButtonStyle = {
    ...style, // 共通スタイルを展開
    backgroundColor: '#ff7700', // 購入ボタンの背景色
  };




  return (
    <div className="mx-auto max-w-md">
      <div className="border border-gray-300 p-5">
        {data && data.status === 'success' ? (
          <>
            <div className="text-left py-2">
              <div className="font-bold">商品CD</div> {/* 商品コードの表示を追加 */}
              {/* 商品コードから`.0`を削除して表示 */}
            <div>{String(Number(data.message.PRD_CD))}</div>
            </div>
            <div className="text-left py-2">
              <div className="font-bold">商品名</div>
              <div>{data.message.PRD_NAME}</div>
            </div>
            <div className="text-left py-2">
              <div className="font-bold">価格</div>
              <div>{data.message.PRD_PRICE}円</div>
            </div>
          </>
        ) : (
          data && data.status === 'failed' && !errorOccurred && (
            <div className="text-red-500">{data.message}</div>
          )
        )}
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleAddToPurchaseList}
          style={addButtonStyle}
        >
          追加
        </button>
      </div>

      {purchaseList.length > 0 && (
        <div className="mt-4">
          <div className="font-bold text-left mb-2">購入リスト</div>
          <div className="border-t border-b border-gray-300">
            <div className="flex justify-between items-center py-2">
              <div className="flex-1 font-bold">商品名</div>
              <div className="flex-1 font-bold text-right">数量</div>
              <div className="flex-1 font-bold text-right">単価</div>
              <div className="flex-1 font-bold text-right">合計額</div>
            </div>
            {purchaseList.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <div className="flex-1">{item.PRD_NAME}</div>
                <div className="flex-1 text-right">
                  <input
                    type="number"
                    min="0"
                    className="text-right"
                    value={item.quantity}
                    onChange={e => handleQuantityChange(index, parseInt(e.target.value))}
                    style={{ width: '3em' }} // ここで入力フィールドの幅を調整することができます。
                  />個
                </div>
                <div className="flex-1 text-center">{item.PRD_PRICE.toLocaleString()}円</div>
                <div className="flex-1 text-right">
                  {(item.quantity * item.PRD_PRICE).toLocaleString()}円
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-b border-gray-300 text-right p-2 mt-4">
        <div>合計 {totalWithTax.toLocaleString()} (税抜{totalWithoutTax.toLocaleString()})円</div>
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={handlePurchase}
          style={purchaseButtonStyle}
        >
          購入
        </button>
      </div>
    </div>
  );
}

export default OutputArea;