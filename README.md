# Express API 代理伺服器 Demo

本專案是一個基於 Express.js 的 API 代理伺服器，使用 `http-proxy-middleware` 來代理請求，並整合 `log4js` 進行日誌記錄。此專案允許您輕鬆建立 API 代理，透過中介層處理請求，並可記錄詳細的請求與回應資訊，適用於需要安全性與記錄能力的應用。此外，伺服器支援多種 `Content-Type` 的請求解析，如 `text/plain`, `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`，確保不同類型的請求皆能被正確解析與轉發。

## 功能特點

- 提供靜態檔案服務
- API 代理功能 (使用 http-proxy-middleware)
- 日誌記錄 (整合 log4js，支援自定義日誌檔路徑)
- 安全性控制 (限制存取特定檔案與資料夾)
- 錯誤處理與 404 頁面
- 請求主體解析 (bodyParserPreProcessing、bodyParserPostProcessing)
- 忽略特定路徑 (ignoreFileRoutes)

## 安裝步驟

1. 複製專案到本機：
```bash
git clone <repository-url>
cd express-api-proxy-server-demo
```

2. 安裝相依套件：
```bash
npm install
```

## 使用方式

1. 設定環境變數 (依需求設定)：
   - `PORT`: 伺服器埠號（預設：3000）
   - `Log_File_Path`: 日誌檔儲存路徑

可透過 `.env` 或環境變數設定日誌儲存位置與伺服器端口：
```sh
export PORT=3000
export Log_File_Path=logs/server.log
```

2. 啟動伺服器：
```bash
node main.js
```

3. 伺服器預設在 http://localhost:3000 執行
4. 注意忽略路由與代理錯誤處理方式，請參考 main.js 中的相關註解

## 功能介紹
1. **API 代理**
   - 代理請求至 `http://127.0.0.1:3001`
   - 支援日誌記錄，包含請求與回應資訊，詳細分析 HTTP Headers 與 Body
   - 可攔截請求，進行請求修改或轉發至不同的後端 API

2. **請求日誌記錄**
   - 記錄請求方法、URL、IP、請求 Body，提供完整的請求資訊
   - 記錄回應時間、狀態碼、回應內容，確保回應結果符合預期
   - 日誌存儲至 `logs/` 目錄下，並根據日期自動管理日誌檔案

3. **支援不同 Content-Type 處理**
   - `text/plain`：解析純文字請求
   - `application/json`：解析 JSON 格式請求
   - `application/x-www-form-urlencoded`：解析表單請求
   - `multipart/form-data`：處理多部分請求，支援文件上傳
   - 透過 `body` 套件提供自動解析，確保請求數據可用
   
4. **靜態資源與安全性**
   - 自動阻擋存取敏感文件（如 `package.json`, `.gitignore`, `README.md` 等）
   - 禁止存取 `node_modules` 目錄，避免洩露伺服器端代碼與依賴關係
   - 自動處理 `404 Not Found`，避免暴露伺服器詳細資訊

## API 路由
| Method | 路徑        | 描述                     |
|--------|------------|--------------------------|
| ALL    | `/my-service/*` | 代理 API 請求             |
| ALL    | `*`        | 處理靜態文件與 404 回應    |

## 錯誤處理
1. 若請求目標 API 服務不可用，將回應錯誤日誌，並返回適當的錯誤碼。
2. `404 Not Found` 會自動記錄並返回 `404` 回應，確保用戶獲得適當的錯誤處理訊息。
3. 伺服器支援 `gzip` 壓縮解壓，確保返回內容可讀且高效。
4. 所有請求與回應資訊皆會記錄至日誌，方便除錯與分析。

## API 代理設定

預設代理設定：
- 代理路徑: `/my-service`
- 目標 API: `https://jsonplaceholder.typicode.com`
- 所有發送到 `/my-service/*` 的請求將被轉發至目標 API
  - 如：發一個 request 到 `http://localhost:3000/my-service/posts/1`，經過 proxy 後實際會將 request 發送到 `https://jsonplaceholder.typicode.com/posts/1`，`my-service` 會被空字串取代，而保留 `post/1`。

## 安全性設定

- 停用 `/node_modules` 資料夾存取
- 限制特定系統檔案（如 package.json、main.js 等）存取

## 專案結構

```
express-api-proxy-server-demo/
  ├── main.js           # 主要伺服器程式碼（包含 log4js 與 API 代理設定）
  ├── package.json      # 專案相依套件設定
  ├── logs/             # 存放日誌檔案
  └── README.md         # 專案說明文件
```

## 相依套件

本專案使用以下主要的 Node.js 套件：
- `express`: 版本為 `^4.21.2`，建立 API 伺服器，提供快速、靈活的 Web 框架
- `http-proxy-middleware`: 版本為 `^3.0.3`，用於代理 API 請求，允許攔截與修改請求
- `log4js`: 記錄請求與回應日誌，提供完整的日誌管理功能
- `body`：處理請求的不同 `Content-Type`，確保請求內容正確解析
- `zlib`：處理 GZIP 壓縮的回應，提高傳輸效率

## 授權
本專案使用 `ISC` 授權，可自由使用與修改。

## 相關文章

- [Proxy Pattern. 其實 Proxy… | by 莫力全 Kyle Mo | Medium](https://oldmo860617.medium.com/proxy-pattern-5f89595dcd30)
- [用 Node.js 建立一個簡單的 Http Proxy. 在上一篇文章中我們了解了 proxy pattern… | by 莫力全 Kyle Mo | Medium](https://oldmo860617.medium.com/%E7%94%A8-node-js-%E5%BB%BA%E7%AB%8B%E4%B8%80%E5%80%8B%E7%B0%A1%E5%96%AE%E7%9A%84-http-proxy-5262e349a1ad)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
