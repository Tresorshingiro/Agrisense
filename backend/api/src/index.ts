import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkInit } from "./middleware/clerk";

import fertilizerRouter from "./routes/fertilizer";
import yieldRouter      from "./routes/yield";
import mapRouter        from "./routes/map";
import historyRouter    from "./routes/history";
import webhooksRouter   from "./routes/webhooks";

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());

// Raw body for Clerk webhook signature verification (before json parser)
app.use("/api/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Clerk session parsing for all /api routes
app.use("/api", clerkInit);

app.use("/api/fertilizer", fertilizerRouter);
app.use("/api/yield",      yieldRouter);
app.use("/api/map",        mapRouter);
app.use("/api/history",    historyRouter);
app.use("/api/webhooks",   webhooksRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`AgriSense API running on port ${PORT}`);
});

export default app;
