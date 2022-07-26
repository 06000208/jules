import { setTimeout as wait } from "node:timers/promises";
import { BaseGuildTextChannel, User } from "discord.js";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { DateTime, Interval } from "luxon";
import humanizeDuration from "humanize-duration";

import { log } from "../log.js";
import { collectData } from "./dataCollection.js";
import { analytics, emojis } from "../databases.js";
import { hook } from "../webhook.js";
import { discord } from "../discord.js";

/**
 * @typedef {Object} Analytics
 * @property {?string} authorization person who authorized this action in the format "user.tag (user.id)"
 * @property {?string} filter if applicable, a string representing what was used as a filter
 * @property {?string} channel the targeted channel in the format "#channel.name (channel.id) in guild.name (guild.id)"
 * @property {?string} before
 * @property {?string} after
 * @property {number} loops Number of loops taken to process a channel
 * @property {number} fetched Number of messages fetched from discord
 * @property {number} valid Number of valid messages that passed the filter
 * @property {?DateTime} start A luxon DateTime, will be automatically serialized to a string by database.write()
 * @property {?DateTime} end A luxon DateTime, will be automatically serialized to a string by database.write()
 * @property {?string} duration
 */

/**
 * Default data written to the database
 * @type {Analytics}
 */
const defaultAnalyticsData = {
    "authorization": null,
    "filter": null,
    "channel": null,
    "before": null,
    "after": null,
    "loops": 0,
    "fetched": 0,
    "valid": 0,
    "start": null,
    "end": null,
    "duration": null,
};

/**
 * @param {BaseGuildTextChannel} channel
 * @param {string} id
 */
export const messageHyperlink = (channel, id) => `[${id}](<https://discord.com/channels/${channel.guildId}/${channel.id}/${id}>)`;

/**
 * Not using nested ternary statements for this nonsense
 * @param {?string} before
 * @param {?string} after
 * @param {BaseGuildTextChannel} channel
 */
export const describeBounds = function(before, after, channel) {
    if (channel) {
        if (before && after) return `bound to after ${messageHyperlink(channel, after)} and before ${messageHyperlink(channel, before)}`;
        if (before) return `bound to before ${messageHyperlink(channel, before)}`;
        if (after) return `bound to after ${messageHyperlink(channel, after)}`;
    } else {
        if (before && after) return `bound to after ${after} and before ${before}`;
        if (before) return `bound to before ${before}`;
        if (after) return `bound to after ${after}`;
    }
    return "without bounds";
};

/**
 * @typedef {Object} ProcessingState
 * @property {?string} before
 * @property {?string} after
 * @property {boolean} iterating
 */

/**
 * @callback messageProcessing
 * @param {Message} message
 */

/**
 * Starts iteratively processing all the messages in a given channel
 * @param {User} authorizer User who authorized this to occur
 * @param {BaseGuildTextChannel} channel
 * @param {messageProcessing} callback Function called with valid messages
 * @param {?User} [user] Used to filter messages to a specific user
 * @param {?string} before Discord id of the message *before* where you want processing to start
 * @param {?string} after Discord id of the message *after* where you want processing to end
 * @returns {Promise<Analytics>}
 */
const processAllChannelMessages = async function(authorizer, channel, callback, user, before, after) {
    const id = DiscordSnowflake.generate().toString();
    log.debug(`[${id}] starting to iterate messages in #${channel.name} (${channel.id}) ${describeBounds(before, after)}`);
    await analytics.read();
    analytics.data[id] = { ...defaultAnalyticsData };
    analytics.data[id].authorization = `${authorizer.tag} (${authorizer.id})`;
    if (user) analytics.data[id].filter = `${user.tag} (${user.id})`;
    analytics.data[id].channel = `#${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})`;
    if (before) analytics.data[id].before = before;
    if (after) analytics.data[id].after = after;
    analytics.data[id].start = DateTime.now();
    /**
     * object used to hold the current processing state
     * @type {ProcessingState}
     */
    const state = {
        before: before || null,
        after: after || null,
        iterating: true,
    };
    while (state.iterating) {
        analytics.data[id].loops++;
        // the wait simply avoids hitting discord with more than 1r/1s
        await wait(1000);
        const options = { "limit": 100 };
        // before and after are mutually exclusive, prefer using before
        if (state.before) {
            options.before = state.before;
        } else if (state.after) {
            options.after = state.after;
        }
        let messages;
        try {
            messages = await channel.messages.fetch(options);
        } catch (error) {
            log.error({ "error": error.name || null, "stack": error.stack || null }, `encountered an error attempting to fetch messages from ${channel}, stopping prematurely: ${error.message}`);
            if (hook) {
                await hook.send({
                    content: `encountered an error (${error.message ? error.message.substring(0, 200) : "no message"}) attempting to fetch messages from ${channel} and must stop prematurely, see console and logs for more details`,
                    username: discord.client.user.username,
                    avatarURL: discord.client.user.avatarURL({ format: "png" }),
                });
            }
            return null;
        }
        analytics.data[id].fetched += messages.size;
        const validMessages = user ? messages.filter((message) => message.author.id === user.id) : messages.clone();
        // account for when before and after are used simultaneously
        if (options.before && state.after) {
            const stopMessage = messages.get(state.after);
            if (stopMessage) {
                validMessages.sweep((message) => message.createdTimestamp <= stopMessage.createdTimestamp);
                state.iterating = false;
            }
        }
        analytics.data[id].valid += validMessages.size;
        for (const message of validMessages.values()) {
            await callback(message, id);
        }
        log.debug(`[${id}] [${analytics.data[id].loops} loops deep] ${validMessages.size} ${validMessages.size == 1 ? "message was" : "messages were"} ${user ? `valid (from ${user.tag})` : "valid"} out of ${messages.size}, for a total of ${analytics.data[id].valid} out of ${analytics.data[id].fetched}`);
        if (state.before) {
            state.before = messages.lastKey();
        } else if (state.after) {
            state.after = messages.firstKey();
        }
        if (state.iterating) state.iterating = messages.size === 100;
    }
    analytics.data[id].end = DateTime.now();
    const interval = Interval.fromDateTimes(analytics.data[id].start, analytics.data[id].end);
    analytics.data[id].duration = humanizeDuration(interval.length("milliseconds"));
    log.debug(`[${id}] finished iterating #${channel.name} (${channel.id}) ${describeBounds(before, after)}, fetched ${analytics.data[id].fetched} ${analytics.data[id].fetched == 1 ? "message" : "messages"} and attempted to handle ${analytics.data[id].valid} in ${analytics.data[id].duration}`);
    await analytics.write();
    return analytics.data[id];
};

/**
 * Used as clear's callback when saving isn't `true`
 * @param {Message} message
 */
const deleteMessage = async function(message) {
    if (message.deletable) {
        await message.delete();
        // not scientific, simply avoids hitting discord with more than 1r/1s
        // discord.js has its own internal rate limits and action queues based
        // on the cooldowns it gets in the responses from discord, so it could
        // be safe to lower it, but id prefer not
        await wait(1000);
    }
};

/**
 * Used as clear's callback when saving is enabled
 * @param {Message} message
 */
const saveDataAndDeleteMessage = async function(message) {
    await collectData(message);
    await deleteMessage(message);
};

/**
 * Save function
 * @param {User} authorizer
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {?User} user Optional user parameter
 * @param {?string} before Optional before bound
 * @param {?string} after Optional after bound
 */
export const save = async function(authorizer, channel, user, before, after) {
    log.debug(`${authorizer.tag} (${authorizer.id}) succesfully initiated saving, collecting ${before || after ? "some" : "all"} emojis ${user ? `from ${user.tag} (${user.id}) in` : `from`} #${channel.name} (${channel.id}) ${describeBounds(before, after)}`);
    if (hook) {
        await hook.send({
            content: `${authorizer.tag} succesfully initiated saving, collecting ${before || after ? "some" : "all"} emojis ${user ? `from ${user.tag} in` : `from`} ${channel} ${describeBounds(before, after, channel)}`,
            username: discord.client.user.username,
            avatarURL: discord.client.user.avatarURL({ format: "png" }),
        });
    }
    await emojis.read();
    const knownEmojis = Object.keys(emojis.data).length;
    const results = await processAllChannelMessages(authorizer, channel, collectData, user, before, after);
    if (!results) return;
    await emojis.write();
    const newEmojis = Object.keys(emojis.data).length - knownEmojis;
    if (hook) {
        await hook.send({
            content: `finished iterating ${channel} ${describeBounds(before, after, channel)} ${user ? `using ${user.tag} as a filter` : "with no filter"}, fetched ${results.fetched} ${results.fetched == 1 ? "message" : "messages"} and found ${newEmojis} new emojis in ${results.duration}`,
            username: discord.client.user.username,
            avatarURL: discord.client.user.avatarURL({ format: "png" }),
        });
    }
};

/**
 * Clear function
 * @param {User} authorizer
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {User} user Required user parameter
 * @param {?boolean} saving Optional saving parameter
 * @param {?string} before Optional before bound
 * @param {?string} after Optional after bound
 */
export const clear = async function(authorizer, channel, user, saving, before, after) {
    log.debug(`${authorizer.tag} (${authorizer.id}) succesfully initiated clearing, deleting ${before || after ? "some" : "all"} messages from ${user.tag} (${user.id}) in #${channel.name} (${channel.id}) ${describeBounds(before, after)}`);
    if (hook) {
        await hook.send({
            content: `${authorizer.tag} succesfully initiated clearing, deleting ${before || after ? "some" : "all"} messages ${saving ? "and saving emojis" : "without saving emojis"} from ${user.tag} in ${channel} ${describeBounds(before, after, channel)}`,
            username: discord.client.user.username,
            avatarURL: discord.client.user.avatarURL({ format: "png" }),
        });
    }
    // don't need to check saveData again as its checked by the command or job code
    if (saving) await emojis.read();
    const knownEmojis = saving ? Object.keys(emojis.data).length : 0;
    const callback = saving ? saveDataAndDeleteMessage : deleteMessage;
    const results = await processAllChannelMessages(authorizer, channel, callback, user, before, after);
    if (saving) await emojis.write();
    const newEmojis = saving ? Object.keys(emojis.data).length - knownEmojis : 0;
    if (hook) {
        return await hook.send({
            content: `finished iterating ${channel} ${describeBounds(before, after, channel)} using ${user.tag} as a filter, fetched ${results.fetched} ${results.fetched == 1 ? "message" : "messages"}, ${saving ? `found ${newEmojis} new emojis` : "did not check for emojis"}, and attempted to delete ${results.valid} in ${results.duration}`,
            username: discord.client.user.username,
            avatarURL: discord.client.user.avatarURL({ format: "png" }),
        });
    }
};
