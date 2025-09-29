const http = require('http');
const httpProxy = require('http-proxy-middleware');

// Create a proxy server
const proxy = httpProxy.createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // If this is the main HTML page, modify it
    if (req.url === '/' && proxyRes.headers['content-type']?.includes('text/html')) {
      let body = '';
      proxyRes.on('data', function (chunk) {
        body += chunk;
      });
      proxyRes.on('end', function () {
        // Fix the script tag to include type="module"
        const fixedBody = body.replace(
          /<script src="([^"]*)" defer><\/script>/,
          '<script type="module" src="$1" defer></script>'
        );
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Length': Buffer.byteLength(fixedBody)
        });
        res.end(fixedBody);
      });
    } else {
      // For all other requests, just pass them through
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  }
});

const server = http.createServer(proxy);

server.listen(3000, () => {
  console.log('Fixed web server running on http://localhost:3000');
  console.log('This fixes the import.meta error by adding type="module" to the script tag');
});
