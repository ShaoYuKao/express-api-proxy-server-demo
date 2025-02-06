// 引入所需的 Node.js 核心模組和第三方套件
const express = require("express");          // Express 框架，用於建立 Web 伺服器
const fs = require('fs');                    // 檔案系統模組，用於檔案操作
const zlib = require('zlib');                // 壓縮模組，用於處理 gzip 壓縮
const path = require('path');                // 路徑處理模組
const log4js = require("log4js");            // 日誌記錄器
const { createProxyMiddleware } = require('http-proxy-middleware');  // 代理中介軟體

// body-parser 相關套件，用於解析不同類型的請求主體
const textBody = require("body");            // 解析純文字
const jsonBody = require("body/json");       // 解析 JSON
const formBody = require("body/form");       // 解析表單資料
const anyBody = require("body/any");         // 通用解析器

// 設定應用程式基本參數
const _app_folder = __dirname;               // 目前程式執行的目錄路徑

// 定義要忽略的檔案路由清單
const ignoreFileRoutes = ['/main.js', '/package-lock.json', '/package.json', 
  '/.copilot-commit-message-instructions.md', '/.gitignore', '/README.md'];

// 設定日誌記錄器
log4js.configure({
  appenders: {
    everything: {
      type: "dateFile",
      filename: "logs/all-the-logs.log",
      maxLogSize: 10 * 1024 * 1024, // = 10Mb
      pattern: "yyyy-MM-dd-hh",
      numBackups: Number.MAX_SAFE_INTEGER - 1,
      compress: true,
    },
    console: { type: 'console' },
  },
  categories: {
    default: { appenders: ["everything", "console"], level: "debug" },
  },
});

const logger = log4js.getLogger();           // 創建日誌記錄器
logger.level = 'all';                        // 設定日誌記錄器的日誌級別

// 建立 Express 應用程式實例
const app = express();

// 基本配置
const PORT = (process.env.PORT || 3000);     // 伺服器埠號，預設 3000
// const API_SERVICE_URL = "https://jsonplaceholder.typicode.com";  // 代理目標 API
const API_SERVICE_URL = "http://127.0.0.1:3001";

// 設定日誌記錄器中介軟體
app.use(log4js.connectLogger(logger, { level: 'auto' }));

// 紀錄器中介軟體：記錄每個請求的處理時間和基本資訊
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestIP: req.ip || null
    };
    logger.info("Request-Response Log:",logInfo);
  });
  next();
});

/**
 * 請求主體解析器的預處理函式
 * 處理請求的主體內容，根據請求的 Content-Type 使用對應的解析器。
 * 
 * @param {Object} req - 請求對象，包含請求的相關資訊。
 * @param {Object} res - 響應對象，用於回應請求。
 * 
 * @description
 * - 對於 GET 請求，不處理請求主體，直接將 req.payload 設為 null。
 * - 根據不同的 Content-Type 使用對應的解析器來處理請求主體：
 *   - `text/plain`: 處理純文字內容。
 *   - `application/json`: 處理 JSON 內容。
 *   - `application/x-www-form-urlencoded`: 處理 URL 編碼的表單資料。
 *   - `multipart/form-data`: 處理多部分表單資料。
 */
const bodyParserPreProcessing = (req, res) => {
  const contentType = req.headers['content-type'];

  // GET 請求不處理請求主體
  if (req.method.toUpperCase() === "GET") {
    req.payload = null;
    return;
  }

  // 根據不同的 Content-Type 使用對應的解析器
  // 處理純文字內容
  if (contentType && contentType.includes('text/plain')) {
    logger.trace("=== text/plain ===");
    textBody(req, res, (err, body) => {
      if (err) {
        logger.error('contentType text/plain err', err.stack || err.toString());
      }
      req.payload = body || null;
    })
  }

  // 處理 JSON 內容
  if (contentType && contentType.includes('application/json')) {
    logger.trace("=== application/json ===");
    jsonBody(req, res, (err, body) => {
      if (err) {
        logger.error('contentType application/json err', err.stack || err.toString());
      }
      req.payload = body || null;
    })
  }

  // 處理 URL 編碼的表單資料
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    logger.trace("=== application/x-www-form-urlencoded ===");
    anyBody(req, res, (err, body) => {
      if (err) {
        logger.error('contentType application/x-www-form-urlencoded err', err.stack || err.toString());
      }
      req.payload = body || null;
    })
  }

  // 處理多部分表單資料
  if (contentType && contentType.includes('multipart/form-data')) {
    logger.trace("=== multipart/form-data ===");
    formBody(req, res, (err, body) => {
      if (err) {
        logger.error('contentType multipart/form-data err', err.stack || err.toString());
      }
      req.payload = body || null;
    })
  }
}

/**
 * 請求主體解析器的後處理函式
 * 處理請求的 body 內容，根據 Content-Type 進行不同的處理。
 * @param {Object} req - 請求對象，包含 headers 和 payload。
 * @param {Object} res - 回應對象。
 * @returns {string|null} 處理後的請求內容，或 null 如果沒有 payload。
 */
const bodyParserPostProcessing = (req, res) => {
  const contentType = req.headers['content-type'];
  let reqPayload = null;

  if (contentType && contentType.includes('text/plain')) {
    if (req.payload) {
      reqPayload = req.payload
    }
  }

  if (contentType && contentType.includes('application/json')) {
    if (req.payload) {
      const payloadTemp = req.payload;

      // const keysToReplace = ['pin'];
      // keysToReplace.forEach(key => {
      //   if (payloadTemp.hasOwnProperty(key) && typeof payloadTemp[key] === 'string') {
      //     payloadTemp[key] = '*'.repeat(payloadTemp[key].length);
      //   }
      // });
      reqPayload = JSON.stringify(payloadTemp);
    }
  }

  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    if (req.payload) {
      reqPayload = JSON.stringify(req.payload);
    }
  }

  if (contentType && contentType.includes('multipart/form-data')) {
    if (req.payload) {
      reqPayload = req.payload;
    }
  }
  return reqPayload;
}

// 設定代理端點
app.use('/my-service', createProxyMiddleware({
  target: API_SERVICE_URL,     // 代理目標
  changeOrigin: true,         // 改變請求來源
  // logger: console,            // 使用控制台進行紀錄
  logger,                     // 使用 log4js 進行紀錄
  on: {
    // 處理代理請求前的操作
    proxyReq: (proxyReq, req, res) => {
      bodyParserPreProcessing(req, res);
      req.startTime = Date.now(); // 記錄請求開始時間
    },
    // 處理代理回應的操作
    proxyRes: (proxyRes, req, res) => {
      // 在此處理回應資料
      let bodyChunks = [];
      proxyRes.on('data', function(chunk) {
        bodyChunks.push(chunk);
      });
      proxyRes.on('end', function() {
        // 在這裡可以處理或修改回應內容
        const bodyBuffer = Buffer.concat(bodyChunks);
        const resHeaders = proxyRes.headers;
        let responseBody = null;

        // 檢查 content-encoding header
        const resContentEncoding = resHeaders['content-encoding'] || null;
        if (resContentEncoding === 'gzip') {
          // 如果 Response 是 gzip 壓縮的，則解壓縮
          try {
            responseBody = zlib.gunzipSync(bodyBuffer).toString('utf8');
          } catch (error) {
            logger.error('proxyRes zlib.gunzipSync error', error.stack || error.toString());
          }
        } else {
          // 如果 Response 未被壓縮
          responseBody = bodyBuffer.toString('utf8');
        }

        let resContentType = null;
        if (resHeaders && resHeaders['content-type']) {
          resContentType = resHeaders['content-type'];
        }

        const reqContentType = req.headers['content-type'];
        const reqPayload = bodyParserPostProcessing(req, res);
        let reqSocketRemoteAddress = null;
        if (req.socket && req.socket.remoteAddress) {
          reqSocketRemoteAddress = req.socket.remoteAddress;
        }

        let reqConnectionRemoteAddress = null;
        if (req.connection && req.connection.remoteAddress) {
          reqConnectionRemoteAddress = req.connection.remoteAddress
        }

        let startTime = null;
        if (req.startTime) {
          startTime = getFormattedDateTime(req.startTime);
        }

        const reqInfo = {
          DateTime: startTime,
          Method: req.method,
          target: API_SERVICE_URL,
          URL: req.url,
          Headers: req.headers ? JSON.stringify(req.headers) : null,
          'x-forwarded-for': req.headers['x-forwarded-for'] || null,
          ContentType: reqContentType || null,
          IP: req.ip || null,
          IPs: req.ips.toString() || null,
          ConnectionRemoteAddress: reqConnectionRemoteAddress,
          Cookies: req.headers.cookie,
          SocketRemoteAddress: reqSocketRemoteAddress,
          Payload: reqPayload || null
        };

        const resInfo = {
          DateTime: getFormattedDateTime(Date.now()),
          StatusCode: res.statusCode || null,
          Headers: resHeaders ? JSON.stringify(resHeaders) : null,
          ContentType: resContentType,
          'content-encoding': resContentEncoding,
          Cookies: proxyRes.headers['set-cookie'],
          Payload: responseBody || null
        };
        
        const duration = Date.now() - req.startTime; // 計算請求時間

        const logInfo = {
          Request: reqInfo,
          Response: resInfo,
          duration: `${duration}ms`
        };
        logger.info(logInfo);
      });
    },
    // 處理錯誤情況
    error: (err, req, res) => {
      logger.error('handle error', err);
    }
  }
}));

// 處理被忽略的檔案路由
app.use(ignoreFileRoutes, (req, res) => {
  notFound(req, res);
});

// 禁止存取 node_modules 目錄
app.use('/node_modules/*', (req, res, next) => {
  res.status(403).send('Access denied');
});

// 處理靜態檔案請求
app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));

// 處理所有其他請求
app.all('*', (req, res) => {
  try {
    const filePath = path.join(_app_folder, 'hostingstart.html');
    
    // 判斷目錄的檔案是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    res.status(200).sendFile(filePath);
  } catch (error) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: "Error",
      requestUrl: req.url,
      requestIP: req.ip || null,
      error: error.stack || error.toString()
    };
    logger.error("app.all error", errorInfo);
    notFound(req, res);
    return;
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  const serverStartTime = new Date().toISOString();
  const message = `Server start time: ${serverStartTime}, Server is running on port ${PORT}`;
  console.log(message);
  logger.info(message);
});

/**
 * 處理 404 找不到頁面的情況
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 */
function notFound(req, res) {
  const requestUrl = req.url;
  logger.info(`404 Not Found: ${requestUrl}`);
  res.status(404).send('404 Not Found');
  return;
}

/**
 * 格式化日期時間字串
 * @param {number} timestamp - 時間戳記
 * @returns {string} 格式化後的日期時間字串 (YYYY-MM-DD HH:mm:ss.SSS)
 */
function getFormattedDateTime(timestamp) {
  const date = new Date(timestamp);;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
