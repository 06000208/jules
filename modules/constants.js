import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

/**
 * Used in various places, must be filename friendly on both windows and linux
 * @type {string}
 */
const name = "jules";

/**
 * Root directory
 * @type {string}
 */
const directory = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @see https://docs.npmjs.com/cli/v8/configuring-npm/package-json
 * @type {Object}
 */
const packageData = JSON.parse(readFileSync(join(directory, "package.json")));

/**
 * Current version, retrieved from package.json
 * @type {string}
 */
const version = packageData.version;

/**
 * Array of lowercase valid environment variable names
 *
 * Environment variables provided via the .env file should follow google's
 * naming standard and use uppercase names
 * @see https://google.github.io/styleguide/shellguide.html#s7.3-constants-and-environment-variable-names
 * @see https://web.archive.org/web/20220415192041id_/https://google.github.io/styleguide/shellguide.html#s7.3-constants-and-environment-variable-names
 * @type {string[]}
 */
const environmentVariables = [
    "dev",
    "discord_token",
    "discord_webhook_url",
    "discord_client_id",
    "discord_owner_ids",
    "jules_save_emojis",
    "jules_save_links",
    "jules_save_attachments",
];

/**
 * Presence for use on start up
 * @type {PresenceData[]}
 */
const defaultPresence = {
    activities: [{
        type: "WATCHING",
        name: "for commands",
    }],
};

export {
    name,
    directory,
    packageData,
    version,
    environmentVariables,
    defaultPresence,
};
