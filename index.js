// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3300;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

// Secret key for JWT verification
const JWT_SECRET = 'secret';

// Middleware to verify JWT for all routes
function authenticateJWT(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided!' });
  }

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
    req.user = decoded; // Optional: store the decoded user info in request
    next();
  });
}

// Proxy configurations for each microservice
const cartProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/cart': '',
  },
});

const catalogProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/catalog': '',
  },
});

const authProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
});

// Apply JWT middleware and proxy for each microservice
app.use('/cart', authenticateJWT, cartProxy);

// Routes without JWT verification
app.use('/catalog', catalogProxy);
app.use('/auth', authProxy);


// Generic route for invalid endpoints
app.use('*', (req, res) => {
  res.status(404).send({ message: 'Service not found!' });
});

app.get('/', (req, res) => {
  res.send('Hello World! its me a reverse proxy server');
})

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
