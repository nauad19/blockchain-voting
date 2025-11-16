// server.js (New File)
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`\n=================================================`);
  console.log(`✅ Server is running! Access the DApp here:`);
  console.log(`🌐 http://localhost:${port}`);
  console.log(`=================================================\n`);
});