const path = require('path');
const express = require('express');
const analyzeRoutes = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API routes
app.use('/api', analyzeRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
