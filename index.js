const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database
const urlDatabase = {};

// Counter for generating short URLs
let counter = 1;

// Route to generate short URL
app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;

    // Check if URL is valid
    const urlRegex = /^https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9]+(\/\S*)?$/;
    if (!urlRegex.test(originalUrl)) {
        return res.json({ error: 'invalid url' });
    }

    // Check if URL exists
    dns.lookup(new URL(originalUrl).hostname, (err) => {
        if (err) {
            return res.json({ error: 'invalid url' });
        } else {
            // Generate short URL
            const shortUrl = counter++;
            urlDatabase[shortUrl] = originalUrl;
            return res.json({ original_url: originalUrl, short_url: shortUrl });
        }
    });
});

// Route to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
    const shortUrl = req.params.short_url;
    const originalUrl = urlDatabase[shortUrl];
    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.json({ error: 'short url not found' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
