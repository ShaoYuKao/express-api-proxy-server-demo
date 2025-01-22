/**
 * @file main.js
 * @description 這是 Express 伺服器的主要檔案，用於提供靜態檔案服務、代理 API 服務等功能。
 */

const express = require("express");
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const _app_folder = __dirname;
const ignoreFileRoutes = ['/main.js', '/package-lock.json', '/package.json', 
  '/.copilot-commit-message-instructions.md', '/.gitignore', '/README.md'];

const app = express();

// Configuration
const PORT = (process.env.PORT || 3000);
const API_SERVICE_URL = "https://jsonplaceholder.typicode.com";

// Proxy endpoints
/**
 * 使用 createProxyMiddleware 中介軟體代理 API 服務。
 */
app.use('/my-service', createProxyMiddleware({
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
      [`^/my-service`]: '',
  },
}));

/**
 * 忽略 node_modules 資料夾的中介軟體。
 */
app.use('/node_modules/*', (req, res, next) => {
  res.status(403).send('Access denied');
});

/**
 * 忽略特定檔案路由的中介軟體。
 * @param {Array<string>} ignoreFileRoutes - 要忽略的檔案路由清單。
 * @param {function} callback - 處理忽略檔案的回呼函數。
 */
app.use(ignoreFileRoutes, (req, res) => {
  notFound(req, res);
});

/**
 * 提供靜態檔案服務。
 * @param {string} pattern - 路由模式，匹配所有靜態檔案。
 * @param {string} folder - 靜態檔案所在的資料夾。
 * @param {object} options - 靜態檔案服務的選項。
 */
app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));

/**
 * 處理所有請求，並回傳根目錄的檔案。
 * @param {string} pattern - 路由模式，匹配所有請求。
 * @param {function} callback - 處理請求的回呼函數。
 */
app.all('*', (req, res) => {
  try {
    const filePath = path.join(_app_folder, 'index.html');
    
    // 判斷目錄的檔案是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    res.status(200).sendFile(`/`, { root: _app_folder });
  } catch (error) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: "Error",
      requestUrl: req.url,
      requestIP: req.ip || null,
      error: error.stack || error.toString()
    };
    console.log("error", errorInfo);
    notFound(req, res);
    return;
  }
});

/**
 * 啟動伺服器並監聽指定的埠號。
 * @param {number} port - 伺服器監聽的埠號。
 * @param {function} callback - 伺服器啟動後的回呼函數。
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/**
 * 處理 404 Not Found 錯誤的函數。
 * @param {object} req - 請求物件。
 * @param {object} res - 回應物件。
 */
function notFound(req, res) {
  const requestUrl = req.url;
  console.log(`404 Not Found: ${requestUrl}`);
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 Not Found</title>
    </head>
    <body>
      <h1>404 Not Found</h1>
      <p>The requested URL ${requestUrl} was not found on this server.</p>
    </body>
    </html>
  `);
  res.end();
  return;
}