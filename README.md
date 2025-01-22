# Express API 代理伺服器

這是一個使用 Express.js 建立的 API 代理伺服器，提供靜態檔案服務和 API 代理功能。

## 功能特點

- 提供靜態檔案服務
- API 代理功能 (使用 http-proxy-middleware)
- 安全性控制 (限制存取特定檔案和資料夾)
- 錯誤處理和 404 頁面

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

1. 啟動伺服器：
```bash
node main.js
```

2. 伺服器將在 http://localhost:3000 啟動

## API 代理設定

專案預設代理設定：
- 代理路徑: `/my-service`
- 目標 API: `https://jsonplaceholder.typicode.com`
- 所有送到 `/my-service/*` 的請求將被轉發到目標 API

## 安全性設定

- 已停用 `/node_modules` 資料夾的存取
- 特定系統檔案（如 package.json, main.js 等）已被限制存取

## 環境變數

- `PORT`: 伺服器埠號（預設：3000）

## 專案結構

```
express-api-proxy-server-demo/
  ├── main.js           # 主要伺服器程式碼
  ├── package.json      # 專案相依套件設定
  └── README.md         # 專案說明文件
```

## 相依套件

- express: ^4.21.2
- http-proxy-middleware: ^3.0.3

## 相關文章

- [Proxy Pattern. 其實 Proxy… | by 莫力全 Kyle Mo | Medium](https://oldmo860617.medium.com/proxy-pattern-5f89595dcd30)
- [用 Node.js 建立一個簡單的 Http Proxy. 在上一篇文章中我們了解了 proxy pattern… | by 莫力全 Kyle Mo | Medium](https://oldmo860617.medium.com/%E7%94%A8-node-js-%E5%BB%BA%E7%AB%8B%E4%B8%80%E5%80%8B%E7%B0%A1%E5%96%AE%E7%9A%84-http-proxy-5262e349a1ad)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
