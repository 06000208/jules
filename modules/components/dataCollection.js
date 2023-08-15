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
export const saveData = env?.JULES_SAVE_EMOJIS === "true";

/**
 * Convenience function
 */
const parseEmojiData = (data) => ({ animated: Boolean(data.animated), name: data.name, id: data.id });

/**
 * @param {Message} message
 */
export const collectData = async function(message) {
    let newEmojis = false;
    if (message.content) {
        for (const match of message.content.matchAll(CustomEmojiGlobal)) {
            if (match.groups.id && !emojis.data[match.groups.id]) {
                newEmojis = true;
                emojis.data[match.groups.id] = parseEmojiData(match.groups);

            }
        }
    } else if (!message.embeds.length && !message.attachments.size) {
        log.trace(`unable to parse emojis from message id ${message.id}, falsy content with no attachments or embeds? occured in #${message.channel.name} (${message.channelId})`);
    }
    if (message.reactions.cache.size) {
        for (const reaction of message.reactions.cache.values()) {
            if (reaction.emoji.id && !emojis.data[reaction.emoji.id]) {
                newEmojis = true;
                emojis.data[reaction.emoji.id] = parseEmojiData(reaction.emoji);
            }
        }
    }
    if (newEmojis) await emojis.write();
};
