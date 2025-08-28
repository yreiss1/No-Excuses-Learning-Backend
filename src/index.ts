import { createServer } from "./server";
import { env } from "./modules/env";
import logger from "./modules/logger";
import { startDailyLessonsWorker } from "./worker/workerManager";

const app = createServer();
const port = env.PORT;
startDailyLessonsWorker();
app.listen(port, () => {
  logger.info({ port }, `Server running on http://localhost:${port}`);
});
