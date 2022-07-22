import { Message } from "discord.js";
import { env } from "node:process";
import { emojis, links, attachments } from "../databases.js";
import { FormattedCustomEmojiWithGroups } from "@sapphire/discord.js-utilities";

// This file controls what data is collected and how

/**
 * Whether to collect emojis when using either /save or /clear with optional saving enabled
 * @type {boolean}
 */
export const saveEmojis = env?.jules_save_emojis === "true";

/**
 * Whether to collect links when using either /save or /clear with optional saving enabled
 * @type {boolean}
 */
export const saveLinks = env?.jules_save_links === "true";

/**
 * Whether to collect links when using either /save or /clear with optional saving enabled
 * @type {boolean}
 */
export const saveAttachments = env?.jules_save_attachments === "true";

/**
 * @param {Message} message
 */
export const collectData = async function(message) {
    // this is unfinished, and will currently do nothing
    if (saveEmojis) {
        //
    }
    if (saveLinks) {
        //
    }
    if (saveAttachments) {
        //
    }
};
