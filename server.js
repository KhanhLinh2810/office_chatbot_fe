// Proxy server cho Office Chatbot - cổng 3000
// Giải quyết vấn đề CORS khi gọi API backend

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_TARGET = 'http://127.0.0.1:8000';

// Bảng MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Phục vụ file tĩnh từ thư mục public
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Không tìm thấy trang</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Proxy request tới API backend
function proxyRequest(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:8000' },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Thêm CORS headers
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detail: 'Không thể kết nối tới API server' }));
  });

  req.pipe(proxyReq);
}

// Xử lý request
const server = http.createServer((req, res) => {
  // Xử lý CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    res.end();
    return;
  }

  // Proxy các request API
  if (req.url.startsWith('/api/')) {
    proxyRequest(req, res);
    return;
  }

  // Phục vụ file tĩnh
  let filePath = path.join(__dirname, 'public', req.url);
  if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  // Nếu không có extension, thử thêm .html
  if (!path.extname(filePath)) {
    filePath += '.html';
  }

  serveStaticFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`🏢 Office Chatbot đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 API proxy tới ${API_TARGET}`);
});
