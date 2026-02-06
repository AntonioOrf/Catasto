require('dotenv').config();
const express = require('express');
const cors = require('cors');

app.get('/', (req, res) => {
  res.send('Il server è attivo!');
});

// Routes
const catastoRoutes = require('./routes/catasto.routes');
const parentiRoutes = require('./routes/parenti.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();
app.use(cors());

// Mount Routes
app.use('/api', systemRoutes); // /api/ping
app.use('/api/catasto', catastoRoutes); // /api/catasto, /api/catasto/sidebar
app.use('/api/parenti', parentiRoutes); // /api/parenti/:id

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});