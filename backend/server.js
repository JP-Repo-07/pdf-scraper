const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const yazl = require('yazl');
const cors = require('cors');

const app = express();
app.use(cors());

// --- Scrape route ---
app.get('/scrape', async (req, res) => {
  const { url } = req.query;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const pdfLinks = [];
    $('a').each((i, el) => {
      let link = $(el).attr('href');
      if (link && link.includes('.pdf')) {
        if (link.startsWith('/')) {
          const base = new URL(url).origin;
          link = base + link;
        }
        pdfLinks.push(link);
      }
    });
    res.json({ pdfLinks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape site' });
  }
});

// --- Bundle route using yazl ---
app.get('/bundle', async (req, res) => {
  const { urls, prefix } = req.query;
  const pdfLinks = urls.split(',');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=pdfs_bundle.zip');

  const zipfile = new yazl.ZipFile();

  for (const link of pdfLinks) {
    try {
      const response = await axios.get(link, { responseType: 'arraybuffer' });
      const originalName = link.split('/').pop();
      const filename = (prefix || '') + originalName;
      zipfile.addBuffer(Buffer.from(response.data), filename);
    } catch (err) {
      console.error(`Failed to fetch ${link}: ${err.message}`);
    }
  }

  zipfile.end();
  zipfile.outputStream.pipe(res);
});

app.listen(3001, () => console.log('Backend running on port 3001'));
