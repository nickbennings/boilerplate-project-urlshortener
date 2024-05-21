require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {};

// Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API endpoint for URL shortening
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  dns.lookup(url, (err) => {
    if (err) {
      res.status(400).json({ error: 'Invalid URL' });
    } else {
      const shortUrl = generateShortUrl();
      urlDatabase[shortUrl] = url;
      res.json({ original_url: url, short_url: shortUrl });
    }
  });
});

// API endpoint for URL redirection
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;
  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: 'Short URL not found' });
  }
});

// Function to generate a short URL
function generateShortUrl() {
  const randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
