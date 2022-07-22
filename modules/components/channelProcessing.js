import { setTimeout as wait } from "node:timers/promises";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { BaseGuildTextChannel, ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, Permissions, User } from "discord.js";
import { DateTime, Interval } from "luxon";
import { analytics, emojis } from "../databases.js";
import { collectData, saveData } from "./dataCollection.js";
import { log } from "../log.js";
import { hook } from "../webhook.js";

/**
 * @typedef {Object} Analytics
 * @property {?string} authorization person who authorized this action in the format "user.tag (user.id)"
 * @property {?string} filter if applicable, a string representing what was used as a filter
 * @property {?string} channel the targeted channel in the format "#channel.name (channel.id) in guild.name (guild.id)"
 * @property {number} loops Number of loops taken to process a channel
 * @property {number} processed Number of messages fetched from discord
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
    "loops": 0,
    "processed": 0,
    "valid": 0,
    "start": null,
    "end": null,
    "duration": null,
};

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
 * @returns {Promise<Analytics>}
 */
const processAllChannelMessages = async function(authorizer, channel, callback, user) {
    const id = DiscordSnowflake.generate().toString();
    log.debug(`[${id}] starting to iterate all messages in #${channel.name} (${channel.id})`);
    await analytics.read();
    analytics.data[id] = { ...defaultAnalyticsData };
    analytics.data[id].authorization = `${authorizer.tag} (${authorizer.id})`;
    if (user) analytics.data[id].filter = `${user.tag} (${user.id})`;
    analytics.data[id].channel = `#${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})`;
    analytics.data[id].start = DateTime.now();
    let before = null;
    let iterating = true;
    while (iterating) {
        analytics.data[id].loops++;
        if (before) await wait(1000);
        const messages = await channel.messages.fetch(before ? { "limit": 100, "before": before } : { "limit": 100 });
        analytics.data[id].processed += messages.size;
        const validMessages = user ? messages.filter((message) => message.author.id === user.id) : messages;
        analytics.data[id].valid += validMessages.size;
        for (const message of validMessages.values()) {
            await callback(message, id);
        }
        log.debug(`[${id}] [${analytics.data[id].loops} loops deep] ${validMessages.size} ${validMessages.size == 1 ? "message was" : "messages were"} ${user ? `valid (from ${user.tag})` : "valid"} out of ${messages.size}, for a total of ${analytics.data[id].valid} out of ${analytics.data[id].processed}`);
        before = messages.lastKey();
        iterating = messages.size === 100;
    }
    analytics.data[id].end = DateTime.now();
    const interval = Interval.fromDateTimes(analytics.data[id].start, analytics.data[id].end);
    const units = [];
    if (!interval.hasSame("days")) units.push("days");
    if (!interval.hasSame("hours")) units.push("hours");
    if (!interval.hasSame("minutes")) units.push("minutes");
    if (!interval.hasSame("seconds")) units.push("seconds");
    if (!interval.hasSame("milliseconds")) units.push("milliseconds");
    analytics.data[id].duration = interval.toDuration(units).toHuman();
    log.debug(`[${id}] finished iterating #${channel.name} (${channel.id}), processed ${analytics.data[id].processed} ${analytics.data[id].processed == 1 ? "message" : "messages"} and attempted to handle ${analytics.data[id].valid} in ${analytics.data[id].duration}`);
    await analytics.write();
    return analytics.data[id];
};

/**
 * Used to confirm an action via buttons before proceeding
 * @param {CommandInteraction} command
 * @param {string} action
 * @return {Promise<boolean>}
 */
const confirmAction = async function(command, action) {
    /**
     * Message sent as an inital reply
     * @type {Message}
     */
    const confirmationPrompt = await command.reply({
        content: action,
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle("SECONDARY"),
            ),
        ],
        ephemeral: true,
        fetchReply: true,
    });
    /**
     * Button interaction used for confirming or cancelling
     * @type {?ButtonInteraction}
     */
    let button = null;
    try {
        button = await confirmationPrompt.awaitMessageComponent({
            /**
             * @param {ButtonInteraction} interaction
             */
            filter: (interaction) => interaction.user.id === command.user.id,
            componentType: "BUTTON",
            time: 60 * 1000,
        });
    } catch (error) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but didn't confirm usage within 1 minute`);
    }
    if (!button) {
        await command.editReply({
            content: `didn't confirm usage within 1 minute, cancelled`,
            components: [],
        });
        return false;
    }
    // according to discord's developer documentation, it should be fine to
    // defer buttons as an initial response and never follow up
    button.deferUpdate();
    const confirmation = button.customId === "yes";
    if (!confirmation) {
        await command.editReply({
            content: `okay, cancelled`,
            components: [],
        });
    }
    return confirmation;
};

/**
 * Save command
 * @param {CommandInteraction} command
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {?User} user Optional user parameter
 * @private
 */
const save = async function(command, channel, user) {
    if (!saveData) {
        return await command.reply({
            content: "unable to proceed, saving emojis is explictly disabled",
            ephemeral: true,
        });
    }
    // ask for confirmation
    const confirmation = await confirmAction(command, `are you sure you wish to save data ${user ? `from ${user} (${user.tag}) in` : `from`} ${channel}?`);
    if (!confirmation) return;
    // reply to the user & send message via webhook
    await command.editReply({
        content: `confirmed, saving data ${user ? `from ${user} (${user.tag}) in` : `from`} ${channel} (${channel.id})`,
        components: [],
    });
    const startMsg = `${command.user.tag} (${command.user.id}) succesfully used /save, saving data ${user ? `from ${user.tag} in` : `from`} #${channel.name} (${channel.id})`;
    log.debug(startMsg);
    await hook.send({
        content: startMsg,
        username: command.client.user.username,
        avatarURL: command.client.user.avatarURL({ format: "png" }),
    });
    // start
    await emojis.read();
    const results = await processAllChannelMessages(command.user, channel, collectData, user);
    // finish
    await emojis.write();
    return await hook.send({
        content: `finished iterating #${channel.name} (${channel.id}) ${user ? `filtering by ${user.tag}` : "with no filter"}, processed ${results.processed} ${results.processed == 1 ? "message" : "messages"} and attempted to save data from ${results.valid} in ${results.duration}`,
        username: command.client.user.username,
        avatarURL: command.client.user.avatarURL({ format: "png" }),
    });
};

/**
 * Used as /clear's callback when you provide the optional saving parameter set
 * to `true`
 * @param {Message} message
 */
const saveDataAndDeleteMessage = async function(message) {
    await collectData(message);
    if (message.deletable) await message.delete();
};

/**
 * Used as /clear's callback when saving isn't `true`
 * @param {Message} message
 */
const deleteMessage = async function(message) {
    if (message.deletable) await message.delete();
};

/**
 * Clear command
 * @param {CommandInteraction} command
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {User} user Required user parameter
 * @private
 */
const clear = async function(command, channel, user) {
    /**
     * Optional boolean parameter
     * @type {null|boolean}
     */
    const saving = command.options.getBoolean("saving");
    if (saving && !saveData) {
        return await command.reply({
            content: "unable to proceed with saving enabled, saving emojis is explictly disabled",
            ephemeral: true,
        });
    }
    // ask for confirmation
    const confirmation = await confirmAction(command, `are you sure you wish to delete all messages from ${user} (${user.tag}) in ${channel}?`);
    if (!confirmation) return;
    // reply to the user & send message via webhook
    await command.editReply({
        content: `confirmed, deleting all messages from ${user.tag} in ${channel}${saving ? " and saving certain data" : ""}`,
        components: [],
    });
    const startMsg = `${command.user.tag} (${command.user.id}) succesfully used /clear, deleting all messages from ${user.tag} in #${channel.name} (${channel.id})`;
    log.debug(startMsg);
    await hook.send({
        content: startMsg,
        username: command.client.user.username,
        avatarURL: command.client.user.avatarURL({ format: "png" }),
    });
    // start
    // don't need to check saveData again as when its false this code is never reached
    if (saving) await emojis.read();
    const callback = saving ? saveDataAndDeleteMessage : deleteMessage;
    const results = await processAllChannelMessages(command.user, channel, callback, user);
    // finish
    if (saving) await emojis.write();
    return await hook.send({
        content: `finished iterating #${channel.name} (${channel.id}) ${user ? `filtering by ${user.tag}` : "with no filter"}, processed ${results.processed} ${results.processed == 1 ? "message" : "messages"} and attempted to delete ${results.valid} in ${results.duration}`,
        username: command.client.user.username,
        avatarURL: command.client.user.avatarURL({ format: "png" }),
    });
};

/**
 * Handles checks for both /save and /clear
 * @param {CommandInteraction} command
 */
export const channelCommand = async function(command) {
    /**
     * Required channel parameter
     * @type {BaseGuildTextChannel}
     */
    const channel = command.options.getChannel("channel");
    /**
     * Optional user parameter
     * @type {?User}
     */
    const user = command.options.getUser("user");
    if (channel.type === "DM") {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} on dms`);
        return await command.reply({
            content: "this command may only be used on guild channels",
            ephemeral: true,
        });
    }
    // while someone needs manage messages to run the command, they might not
    // have it for the channel they select
    if (!channel.permissionsFor(command.user.id, true).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} without Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `you don't have permission to do this in ${channel}`,
            ephemeral: true,
        });
    }
    // bot also needs Manage Messages in the supplied channel
    if (!channel.permissionsFor(command.client.user.id, true).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but the bot is missing Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `${command.client.user} is missing Manage Messages in ${channel}, can't proceed`,
            ephemeral: true,
        });
    }
    switch (command.commandName) {
        case "clear":
            return await clear(command, channel, user);
        case "save":
            return await save(command, channel, user);
    }
};
