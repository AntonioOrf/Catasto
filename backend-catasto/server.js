require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");

const app = express();
app.use(compression());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Il server è attivo!");
});

const catastoRoutes = require("./routes/catasto.routes");
const parentiRoutes = require("./routes/parenti.routes");
const systemRoutes = require("./routes/system.routes");
const filtersRoutes = require("./routes/filters.routes");
const mestieriRoutes = require("./routes/mestieri.routes"); // Add mestieri routes

app.use("/api", systemRoutes);
app.use("/api/catasto", catastoRoutes);
app.use("/api/parenti", parentiRoutes);
app.use("/api/filters", filtersRoutes);
app.use("/api/mestieri", mestieriRoutes); // Register new API

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});
