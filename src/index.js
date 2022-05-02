const Tesseract = require('tesseract.js');
const cors = require('cors');
const express = require("express");
const app = express();

const port = process.env.PORT || 80;

const validLangs = new Set(['Latin', 'Cyrillic']);

app.use(cors());

app.get("/", (req, res) => {
  res.send({
    message: "Here's your response from the node.js 🐳 container",
  });
});

app.get("/detectText", (req, res) => {
  console.log('\n\nProcessing: ' + req.query.url);
  const { createWorker } = Tesseract;

  const detect = async (image, options) => {
    const worker = createWorker(options);
    await worker.load();
    await worker.loadLanguage('osd');
    await worker.initialize('osd');
    return worker.detect(image)
      .finally(async () => {
        await worker.terminate();
      });
  };

  detect(
    req.query.url,
    {
      errorHandler: (e) => {
        console.log('Error: ' + e);
        res.send({
          confidence: 0,
        });
      },
      cacheMethod: 'none',
    },
  )
    .then((result) => {
      console.log('Result for URL: ' + req.query.url);
      console.log(result);
      if (validLangs.has(result.data.script)
          && result.data.script_confidence > 0.5
          && result.data.orientation_degrees === 0
          && result.data.orientation_confidence > 2.5) {
        res.send({
          confidence: result.data.script_confidence,
        });
      } else {
        res.send({
          confidence: 0,
        });
      }
    })
    .catch((e) => {
      console.log(e);
    });
});

app.listen(port, () => {
  console.log(`Hi there, I'm listening on port http://localhost:${port}`);
});
