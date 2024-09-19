// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3300;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

app.use(cors({
  credentials: true,
  origin: 'http://localhost:4200'
}));

app.use(cookieParser());

// Secret key for JWT verification
const JWT_SECRET = 'secret';

function authenticateJWT(req, res, next) {
  if (!req.cookies || !req.cookies.jwt) {
    return res.status(401).json({ message: 'No token provided!' });
  }

  const token = req.cookies.jwt;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ message: 'Unauthorized! Invalid token.' });
    }

    if (!decoded || !decoded.userId) {
      console.error('No userId in the token:', decoded);
      return res.status(400).json({ message: 'Token does not contain a valid userId.' });
    }

    req.headers['x-user-id'] = decoded.userId;
    next();
  });
}

// Proxy configurations for each microservice
const ordersProxy = createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/orders': '',
  },
});
const checkoutProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/checkout': '',
  },
});

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
app.use('/orders', authenticateJWT, ordersProxy);
app.use('/checkout', authenticateJWT, checkoutProxy);
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
