/**
 * Startup message with version info, this is in it's own script to ensure it is
 * logged first
 * @module scripts/start
 */

import process from "node:process";
import { version as discordVersion } from "discord.js";
import { name, version as packageVersion } from "../constants.js";
import { log } from "../log.js";

log.info({
    "nodeVersion": process.versions.node,
    "discordVersion": discordVersion,
    "version": packageVersion,
    "platform": process.platform,
    "dev": process.env.DEV?.toLowerCase() === "true",
}, `Starting ${name}`);
