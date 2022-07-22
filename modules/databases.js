import { join } from "node:path";
import { Low, JSONFile } from "lowdb";
import { log } from "./log.js";
import { directory } from "./constants.js";

/**
 * lowdb json database used for analytics collected during recursively scanning
 * channels
 */
export const analytics = new Low(new JSONFile(join(directory, "data", "data.json")));
await analytics.read();
if (!analytics.data) {
    analytics.data = {};
    await analytics.write();
}

/**
 * lowdb json database used for saving emoji data when enabled
 */
export const emojis = new Low(new JSONFile(join(directory, "data", "emojis.json")));
await emojis.read();
if (!emojis.data) {
    analytics.data = {};
    await emojis.write();
}

/**
 * lowdb json database used for saving links when enabled
 */
export const links = new Low(new JSONFile(join(directory, "data", "links.json")));
await links.read();
if (!links.data) {
    links.data = {};
    await links.write();
}

/**
 * lowdb json database used for saving attachments when enabled
 */
export const attachments = new Low(new JSONFile(join(directory, "data", "attachments.json")));
await attachments.read();
if (!attachments.data) {
    attachments.data = {};
    await attachments.write();
}

log.info("Started databases");
