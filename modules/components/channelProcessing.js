import { DiscordSnowflake } from "@sapphire/snowflake";
import { BaseGuildTextChannel, ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, Permissions, User } from "discord.js";
import { DateTime, Interval } from "luxon";
import { analytics } from "../databases.js";
import { collectData, saveAttachments, saveEmojis, saveLinks } from "./dataCollection.js";
import { discord } from "../discord.js";
import { log } from "../log.js";

/**
 * @typedef {Object} Analytics
 * @property {?string} authorization person who authorized this action in the format "user.tag (user.id)"
 * @property {?string} filter if applicable, a string representing what was used as a filter
 * @property {?string} channel the targeted channel in the format "#channel.name (channel.id) in guild.name (guild.id)"
 * @property {number} calls Number of recursions/nesting
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
    "calls": 0,
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
 * The function that handles recursively fetching messages from discord and
 * processing them using the provided callbacks
 *
 * A solution using iteration (such as using a while loop) might be better than
 * recursion, but this was easier to write
 * @param {string} id
 * @param {BaseGuildTextChannel} channel
 * @param {messageProcessing} callback Function called with valid messages
 * @param {?User} [user] Used to filter messages to a specific user
 * @param {?string} [before] Message id used for pagination when recursing
 * @returns {Promise<Analytics>}
 * @private
 */
export const recursiveChannelProcessing = async function(id, channel, callback, user, before) {
    analytics.data[id].calls++;
    const options = before ? { "limit": 50, "before": before } : { "limit": 50 };
    const messages = await channel.messages.fetch(options);
    analytics.data[id].processed += messages.size;
    const validMessages = user ? messages.filter((message) => message.author.id === user.id) : messages;
    analytics.data[id].valid += validMessages.size;
    for (const message of messages.values()) {
        await callback(message, id);
    }
    log.debug(`[recurse ${id}] [${analytics.data[id].calls} layers deep] ${validMessages.size} ${validMessages.size == 1 ? "message was" : "messages were"} valid ${user ? `(from ${user.tag})` : ""} out of ${messages.size}, for a total of ${analytics.data[id].valid} out of ${analytics.data[id].processed}`);
    if (messages.size === 50) {
        // don't need to sort the collection as we can rely on messages.lastKey() being the oldest id
        return await recursiveChannelProcessing(id, channel, callback, user, messages.lastKey());
    } else {
        analytics.data[id].end = DateTime.now();
        analytics.data[id].duration = Interval.fromDateTimes(analytics.data[id].start, analytics.data[id].end).toDuration().toHuman();
        return analytics.data[id];
    }
};

/**
 * Starts recursively processing all the messages in a given channel using
 * recursiveChannelProcessing()
 * @param {User} authorizer User who authorized this to occur
 * @param {BaseGuildTextChannel} channel
 * @param {messageProcessing} callback Function called with valid messages
 * @param {?User} [user] Used to filter messages to a specific user
 * @returns {Promise<Analytics>}
 */
const recurseChannelMessages = async function(authorizer, channel, callback, user) {
    const id = DiscordSnowflake.generate().toString();
    log.debug(`[recurse ${id}] starting to recurse messages in #${channel.name} (${channel.id})`);
    await analytics.read();
    analytics.data[id] = { ...defaultAnalyticsData };
    analytics.data[id].authorization = `${authorizer.tag} (${authorizer.id})`;
    if (user) analytics.data[id].filter = `${user.tag} (${user.id})`;
    analytics.data[id].channel = `#${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})`;
    analytics.data[id].start = DateTime.now();
    const results = await recursiveChannelProcessing(id, channel, callback, user);
    await analytics.write();
    log.debug(`[recurse ${id}] finished recursing #${channel.name} (${channel.id}), processed ${results.processed} ${results.processed == 1 ? "message" : "messages"} and attempted to handle ${results.valid} in ${results.duration}`);
    return results;
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
    if (!saveEmojis && !saveLinks && !saveAttachments) {
        return await command.reply({
            content: "unable to proceed, all forms of saving data are explictly disabled",
            ephemeral: true,
        });
    }
    const confirmation = await confirmAction(command, `are you sure you wish to save data ${user ? `from ${user} (${user.tag}) in` : `from`} ${channel}?`);
    if (!confirmation) return; // confirmAction already replies
    await command.editReply({
        content: `confirmed, saving data ${user ? `from ${user} (${user.tag}) in` : `from`} ${channel} (${channel.id})`,
        components: [],
    });
    log.debug(`${command.user.tag} (${command.user.id}) succesfully used /save, saving data ${user ? `from ${user} (${user.tag}) in` : `from`} #${channel.name} (${channel.id})`);
    const results = await recurseChannelMessages(command.user, channel, collectData, user);
    return await command.followUp({
        content: `done, processed ${results.processed} ${results.processed == 1 ? "message" : "messages"} and attempted to save data from ${results.valid} in ${results.duration}`,
        ephemeral: true,
    });
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
    if (saving && (!saveEmojis && !saveLinks && !saveAttachments)) {
        return await command.reply({
            content: "unable to proceed with saving enabled, all forms of saving data are explictly disabled",
            ephemeral: true,
        });
    }
    const confirmation = await confirmAction(command, `are you sure you wish to delete all messages from ${user} (${user.tag}) in ${channel}?`);
    if (!confirmation) return; // confirmAction already replies
    await command.editReply({
        content: `confirmed, deleting all messages from ${user.tag} in ${channel}`,
        components: [],
    });
    log.debug(`${command.user.tag} (${command.user.id}) succesfully used /clear, deleting all messages from ${user.tag} (${user.id}) in #${channel.name} (${channel.id})`);
    const results = await recurseChannelMessages(command.user, channel, async function(message) {
        if (saving) collectData(message);
        if (message.deletable) await message.delete();
    }, user);
    return await command.followUp({
        content: `done, processed ${results.processed} ${results.processed == 1 ? "message" : "messages"} and attempted to delete ${results.valid} in ${results.duration}`,
        ephemeral: true,
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
