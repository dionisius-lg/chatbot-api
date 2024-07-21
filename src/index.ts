import express, { Express } from "express";
import cron from "node-cron";
import config from "./config";
import router from "./routes";
import { readContent, writeContent } from "./helpers/file";
import { randomString } from "./helpers/value";
import * as logger from "./helpers/logger";
import * as scheduleTask from "./helpers/schedule-task";

const app: Express = express();
const { env, port } = config;

// enable parsing json
app.use(express.json());
// enable parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// log all access
logger.access(app);
// define all route
app.use(router);
// disable x-powered-by
app.disable('x-powered-by');

app.listen(port, '0.0.0.0', async (err?: Error) => {
    if (err) {
        console.error(err);
        return;
    }

    // check api key
    let key = readContent('key.txt');

    // generate new api key if not exist
    if (!key) {
        key = randomString(32, true, true);
        writeContent('key.txt', key);

        console.log(`[server] is generate new Api Key ${key}`);
    }

    console.log(`[server] is running for ${env} environtment | port ${port}`);
});

// running schedule task every 5 minutes
// let isTrainNetwork: boolean = false;
// cron.schedule('*/1 * * * *', async () => {
//     if (isTrainNetwork) {
//         console.log(`[schedule-task] train network is still running...`);
//         return false;
//     }

//     isTrainNetwork = true;
//     await scheduleTask.trainNetwork();
//     isTrainNetwork = false;
// });