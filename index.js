require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser")
const dns = require('dns-lookup');
const mongoose = require("mongoose")

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: Number,
    required: true,
    unique: true
  },
})

let url = mongoose.model('url', urlSchema)

const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", (req, res) => {
  let inputUrl = req.body.url

  try {
    validUrl = new URL(inputUrl)

    dns(validUrl.hostname, (err, address) => {
      if (err) {
        res.json({ error: 'invalid url' })
      } else {

        async function findUrl() {
          try {
            const foundUrl = await url.find({ original_url: validUrl.href }).exec();

            if (foundUrl[0]) {
              res.json({ original_url: foundUrl[0].original_url, short_url: foundUrl[0].short_url })
            } else {
              let urlCount
              const count = async () => {
                try {
                  urlCount = await url.countDocuments({})

                  let newUrl = new url({ original_url: validUrl.href, short_url: urlCount })
                  newUrl.save()
                  res.json({ original_url: validUrl.href, short_url: urlCount })
                } catch (error) {
                  console.log(error)
                }
              }
              count()
            }
          } catch (error) {
            console.log(error);
          }
        }
        findUrl();
      }
    })
  } catch {
    res.json({ error: 'invalid url' })
  }
})

app.get("/api/shorturl/:short_url", (req, res) => {
  let short = req.params.short_url

  async function findByShort() {
    try {
      const foundUrl = await url.find({ short_url: short }).exec();
      if (foundUrl[0]) {
        res.redirect(foundUrl[0].original_url)
      } else {
        res.json({ error: "No short URL found for the given input" })
      }
    } catch (error) {
      console.log(error);
    }
  }
  findByShort();
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
