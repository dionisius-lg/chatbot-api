import express, { Express } from "express";
import swagger from "swagger-ui-express";
import cron from "node-cron";
import config from "./config";
import router from "./routes";
import setupSwagger from "./middleware/setup_swagger";
import * as logger from "./helpers/logger";
import { trainNetwork } from "./helpers/thread";

const app: Express = express();
const { env, port } = config;

// enable parsing json
app.use(express.json());
// enable parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// enable static files
app.use('/public', express.static('public', { index: false }));
// log all access
logger.access(app);
// setup swagger
app.use('/docs', swagger.serve, setupSwagger);
// define all route
app.use(router);
// disable x-powered-by
app.disable('x-powered-by');

app.listen(port, '0.0.0.0', async (err?: Error) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(`[server] is running for ${env} environtment | port ${port}`);
});

// running schedule task every 00:00
let isTrainNetwork: boolean = false;
cron.schedule('0 0 * * *', async () => {
    if (isTrainNetwork) {
        console.log(`[schedule-task] train network is still running...`);
        return false;
    }

    isTrainNetwork = true;
    await trainNetwork();
    isTrainNetwork = false;
});