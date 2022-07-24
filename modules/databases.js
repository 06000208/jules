import { join } from "node:path";
import { Low, JSONFile } from "lowdb";
import { log } from "./log.js";
import { directory } from "./constants.js";

/**
 * lowdb json database used for analytics collected during recursively scanning
 * channels
 */
const analytics = new Low(new JSONFile(join(directory, "data", "data.json")));
await analytics.read();
if (!analytics.data) {
    analytics.data = {};
    await analytics.write();
}

/**
 * lowdb json database used for json defined jobs
 */
const jobs = new Low(new JSONFile(join(directory, "data", "jobs.json")));
await jobs.read();
if (!jobs.data) {
    jobs.data = {
        todo: {},
        done: {},
    };
    await jobs.write();
} else {
    if (!jobs.data.todo) jobs.data.todo = {};
    if (!jobs.data.done) jobs.data.done = {};
}

/**
 * lowdb json database used for saving emoji data when enabled
 */
const emojis = new Low(new JSONFile(join(directory, "data", "emojis.json")));
await emojis.read();
if (!emojis.data) {
    emojis.data = {};
    await emojis.write();
}

log.info("Started databases");

export {
    analytics,
    jobs,
    emojis,
};
