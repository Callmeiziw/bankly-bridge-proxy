const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BRIDGE_BASE = 'https://api.bridgeapi.io/v3/aggregation';
const PROXY_SECRET = process.env.PROXY_SECRET;

if (!PROXY_SECRET) {
  console.error('PROXY_SECRET manquant');
  process.exit(1);
}

// Vérification du secret partagé
app.use((req, res, next) => {
  if (req.headers['x-proxy-secret'] !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Relais vers Bridge API
app.all('*', async (req, res) => {
  const url = `${BRIDGE_BASE}${req.path}`;
  const headers = {};

  ['client-id', 'client-secret', 'bridge-version', 'content-type', 'accept', 'authorization']
    .forEach(h => { if (req.headers[h]) headers[h] = req.headers[h]; });

  try {
    const response = await axios({
      method: req.method,
      url,
      headers,
      data: req.method !== 'GET' ? req.body : undefined,
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge proxy démarré sur le port ${PORT}`));
