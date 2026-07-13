const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

console.log('Starting server...');
console.log('Port:', port);

app.get('/', (req, res) => {
  console.log('Request received');
  res.send('App is working!');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});
