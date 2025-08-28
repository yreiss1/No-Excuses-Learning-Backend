import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { errorHandler, notFound } from "./modules/error";
import logger from "./modules/logger";
import { routes } from "./routes";

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.get("/", (_req, res) => res.send("Hello world"));

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
