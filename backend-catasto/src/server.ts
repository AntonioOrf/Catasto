import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error.middleware.js";
import catastoRoutes from "./routes/catasto.routes.js";
import filterRoutes from "./routes/filter.routes.js";
import parentiRoutes from "./routes/parenti.routes.js";
import mestieriRoutes from "./routes/mestieri.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(cors());
app.use(compression() as any);
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.send("Catasto API is running! 🚀");
});

app.use("/api/catasto", catastoRoutes);
app.use("/api/filters", filterRoutes);
app.use("/api/parenti", parentiRoutes);
app.use("/api/mestieri", mestieriRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
