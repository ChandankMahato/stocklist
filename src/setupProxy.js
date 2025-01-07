const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://merolagani.com",
      changeOrigin: true,
      pathRewrite: { "^/api": "" }, // Rewrite '/api' to ''
    })
  );
};
