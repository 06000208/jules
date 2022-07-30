import { Message } from "discord.js";
import { env } from "node:process";
import { emojis } from "../databases.js";
import { FormattedCustomEmojiWithGroups } from "@sapphire/discord-utilities";
import { log } from "../log.js";
const CustomEmojiGlobal = new RegExp(FormattedCustomEmojiWithGroups, "g");

// This file controls what data is collected and how

/**
 * Whether to collect emojis when using either /save or /clear with optional saving enabled
 * @type {boolean}
 */
export const saveData = env?.jules_save_emojis === "true";

/**
 * @param {Message} message
 */
export const collectData = async function(message) {
    if (message.content) {
        for (const match of message.content.matchAll(CustomEmojiGlobal)) {
            if (match.groups.id && !emojis.data[match.groups.id]) {
                emojis.data[match.groups.id] = { ...match.groups };
            }
        }
    } else {
        log.trace(`falsy message content for id ${message.id} in #${message.channel.name} (${message.channelId}), unable to parse emojis for saving`);
    }
};
