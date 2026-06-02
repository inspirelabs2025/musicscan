const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // Adjust this to match the API path you're proxying
    createProxyMiddleware({
      target: 'http://localhost:3001', // Your backend server address
      changeOrigin: true,
    })
  );
};