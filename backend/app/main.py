from fastapi import FastAPI, HTTPException, Body, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3
import os
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Optional

app = FastAPI()

# CORSを回避するために追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# .envファイルを読み込む
load_dotenv()

# データベースファイルへのパス
DATABASE_URL = os.path.join(os.path.dirname(__file__), "database.db")

class ProductQuery(BaseModel):
    code: str

def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/search_product/")
def search_product(product_query: ProductQuery, tax_code: int = Query(10, description="Tax code")):  
    conn = get_db_connection()
    # 本来は以下のコード
    # product = conn.execute('SELECT * FROM products WHERE PRD_CD = ?', (product_query.code,)).fetchone()
    # 事故らせるためにコードを修正（パラメータ化されていないクエリ実行のコードに修正）
    query = f"SELECT * FROM products WHERE PRD_CD = '{product_query.code}'"
    product = conn.execute(query).fetchone()
    conn.close()

    if product:
        return {
            "status": "success",
            "message": {
                "PRD_ID": product["PRD_ID"],
                "PRD_CD": product["PRD_CD"],
                "PRD_NAME": product["PRD_NAME"],
                "PRD_PRICE": product["PRD_PRICE"]
            }
        }
    else:
        raise HTTPException(status_code=404, detail="Product not found")
    

@app.get("/get_tax_rate/")
def get_tax_rate(tax_code: int = Query(10, description="Default tax code is 10")):  
    conn = get_db_connection()
    tax = conn.execute('SELECT PERCENT FROM tax WHERE CODE = ?', (tax_code,)).fetchone()  # 指定されたTAX CODEの税率を取得
    conn.close()

    if tax:
        return {"rate": tax["PERCENT"]}  # パーセント値そのままを返す
    else:
        raise HTTPException(status_code=404, detail="Tax rate not found")

class PurchaseItem(BaseModel):
    PRD_ID: int
    quantity: int

class PurchaseList(BaseModel):
    items: List[PurchaseItem]
    totalWithTax: Optional[float] = Field(default=None)
    totalWithoutTax: Optional[float] = Field(default=None) 


@app.post("/purchase/")
async def purchase_items(purchase_list: PurchaseList, tax_code: int = Query(10, description="Default tax code is 10")):
    conn = get_db_connection()
    try:
        conn.execute('BEGIN')
        purchase_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 新しい取引番号 (TRD_ID) の採番
        last_trd_id_result = conn.execute('SELECT MAX(TRD_ID) AS last_trd_id FROM tradedetail').fetchone()
        new_trd_id = last_trd_id_result['last_trd_id'] + 1 if last_trd_id_result['last_trd_id'] else 1
        
        total_amount = 0  # 税込み合計金額
        total_amount_ex_tax = 0  # 税抜き合計金額の修正
        tax_rate = conn.execute('SELECT PERCENT FROM tax WHERE CODE = ?', (tax_code,)).fetchone()  # 選択されたTAX CODEの税率を取得
        if not tax_rate:
            raise HTTPException(status_code=404, detail=f"Tax rate with code {tax_code} not found")
        tax_rate = tax_rate["PERCENT"]  # パーセント値を取得

        dtl_id = 1
        for item in purchase_list.items:
            product = conn.execute('SELECT * FROM products WHERE PRD_ID = ?', (item.PRD_ID,)).fetchone()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with ID {item.PRD_ID} not found")

            item_total_price_ex_tax = product["PRD_PRICE"] * item.quantity  # 税抜き価格を計算
            total_amount_ex_tax += item_total_price_ex_tax  # 税抜き合計金額に加算

            item_total_price = item_total_price_ex_tax * (1 + tax_rate)  # 税込み価格を計算
            total_amount += item_total_price  # 税込み合計金額に加算

            for _ in range(item.quantity):
                conn.execute('INSERT INTO tradedetail (TRD_ID, DTL_ID, PRD_ID, PRD_CD, PRD_NAME, PRD_PRICE, DATETIME, TAX_CD) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                             (new_trd_id, dtl_id, product["PRD_ID"], product["PRD_CD"], product["PRD_NAME"], product["PRD_PRICE"], purchase_date, tax_code))
                dtl_id += 1
        
        # trade テーブルへのデータ挿入
        conn.execute('INSERT INTO trade (TRD_ID, DATETIME, EMP_CD, STORE_CD, POS_NO, TOTAL_AMT, TTL_AMT_EX_TAX) VALUES (?, ?, ?, ?, ?, ?, ?)',
                     (new_trd_id, purchase_date, 10, 5, 100, purchase_list.totalWithTax, purchase_list.totalWithoutTax))
        
        conn.commit()
        return {"status": "success", "message": "Purchase completed successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

