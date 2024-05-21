require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define URL Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const Url = mongoose.model('Url', urlSchema);

// Generate a short URL
const generateShortUrl = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Helper function to validate URL format
const isValidUrl = (url) => {
  const regex = /^(http:\/\/|https:\/\/)[^\s/$.?#].[^\s]*$/i;
  return regex.test(url);
};

// POST endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  if (!isValidUrl(url)) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = urlParser.parse(url).hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    Url.findOne({ original_url: url }, (err, foundUrl) => {
      if (err) return res.status(500).json('Server error');
      if (foundUrl) {
        return res.json({ original_url: foundUrl.original_url, short_url: foundUrl.short_url });
      } else {
        const shortUrl = generateShortUrl();
        const newUrl = new Url({ original_url: url, short_url: shortUrl });
        newUrl.save((err, savedUrl) => {
          if (err) return res.status(500).json('Server error');
          res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url });
        });
      }
    });
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  Url.findOne({ short_url: req.params.short_url }, (err, url) => {
    if (err || !url) return res.status(404).json('No URL found');
    res.redirect(url.original_url);
  });
});

// Start server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
