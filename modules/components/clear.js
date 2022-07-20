import { DiscordSnowflake } from "@sapphire/snowflake";
import { BaseGuildTextChannel, ButtonInteraction, Collection, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, Permissions, User } from "discord.js";
import { DateTime, Interval } from "luxon";
import { database } from "../database.js";
import { discord } from "../discord.js";
import { log } from "../log.js";

/**
 * @typedef {Object} ClearingAnalytics
 * @property {?string} authorization "user.tag (user.id)"
 * @property {?string} user "user.tag (user.id)"
 * @property {?string} channel "#channel.name (channel.id) in guild.name (guild.id)"
 * @property {number} runs Number of recursions/nesting
 * @property {number} total Number of messages fetched from discord
 * @property {number} valid Number of valid messages to be deleted
 * @property {number} deletions Number of messages deleted
 * @property {number} skipped Number of messages skipped
 * @property {?DateTime} start
 * @property {?DateTime} end
 * @property {?string} duration
 */

/**
 * @type {ClearingAnalytics}
 */
const defaultAnalyticalData = {
    "authorization": null,
    "user": null,
    "channel": null,
    "runs": 0,
    "total": 0,
    "valid": 0,
    "deletions": 0,
    "skipped": 0,
    "start": null,
    "end": null,
    "duration": null,
};

/**
 * Recursively processes (requests, filters, and deletes) all the messages in a
 * given channel
 * @param {string} id
 * @param {BaseGuildTextChannel} channel
 * @param {User} user
 * @param {?string} [before]
 * @returns {Promise<ClearingAnalytics>}
 */
const recursiveChannelClear = async function(id, channel, user, before) {
    database.data.analytics[id].runs++;
    const options = before ? { "limit": 50, "before": before } : { "limit": 50 };
    const messages = await channel.messages.fetch(options);
    database.data.analytics[id].total += messages.size;
    const filtered = messages.filter((message) => message.author.id === user.id);
    database.data.analytics[id].valid += filtered.size;
    let deletions = 0;
    for (const message of filtered.values()) {
        if (message.deletable) {
            await message.delete();
            deletions++;
        } else {
            database.data.analytics[id].skipped++;
        }
    }
    database.data.analytics[id].deletions += deletions;
    // don't need to do this, can rely on messages.lastKey() being the oldest id
    // const sorted = messages.sort((messageA, messageB) => messageA.createdTimestamp - messageB.createdTimestamp);
    log.debug(`[clear ${id}] [${database.data.analytics[id].runs} layers deep] out of ${messages.size} messages, ${filtered.size} from ${user.tag} (${user.id}) were found and ${deletions} ${deletions == 1 ? "was" : "were"} deleted for a total of ${database.data.analytics[id].deletions}/${database.data.analytics[id].total}`);
    if (messages.size === 50) {
        return await recursiveChannelClear(id, channel, user, messages.lastKey());
    } else {
        database.data.analytics[id].end = DateTime.now();
        return database.data.analytics[id];
    }
};

/**
 * @param {CommandInteraction} command
 */
export const clear = async function(command) {
    /**
     * @type {BaseGuildTextChannel}
     */
    const channel = command.options.getChannel("channel");
    /**
     * @type {User}
     */
    const user = command.options.getUser("user");
    if (channel.type === "DM") {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /clear on dms`);
        return await command.reply({
            content: "this command may only be used on guild channels",
            ephemeral: true,
        });
    }
    // while someone needs manage messages to run the command, they might not
    // have it for the channel they select
    if (!channel.permissionsFor(command.user.id, true).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /clear without Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `you don't have permission to do this in ${channel}`,
            ephemeral: true,
        });
    }
    // bot also needs Manage Messages in the supplied channel
    if (!channel.permissionsFor(discord.client.user.id, true).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /clear but the bot is missing Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `${this.user} is missing Manage Messages in ${channel}, can't proceed`,
            ephemeral: true,
        });
    }
    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("yes")
            .setLabel("Yes")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("no")
            .setLabel("No")
            .setStyle("SECONDARY"),
    );
    /**
     * @type {Message}
     */
    const confirmationPrompt = await command.reply({
        content: `are you sure you wish to delete all messages from ${user} (${user.tag}) in ${channel}?`,
        components: [row],
        ephemeral: true,
        fetchReply: true,
    });
    /**
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
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /clear but didn't confirm parameters within 1 minute`);
    }
    if (!button) {
        return await command.editReply({
            content: `didn't confirm parameters (${user} in ${channel}) within 1 minute, cancelled`,
            components: [],
        });
    }
    button.deferUpdate();
    if (button.customId !== "yes") {
        return await command.editReply({
            content: `okay, cancelled`,
            components: [],
        });
    }
    await command.editReply({
        content: `confirmed, deleting all messages from ${user} (${user.tag}) in ${channel}`,
        components: [],
    });
    const id = DiscordSnowflake.generate().toString();
    log.debug(`${command.user.tag} (${command.user.id}) succesfully used /clear, deleting all messages from ${user.tag} (${user.id}) in #${channel.name} (${channel.id}), analytics id: ${id}`);
    await database.read();
    database.data.analytics[id] = { ...defaultAnalyticalData };
    database.data.analytics[id].authorization = `${command.user.tag} (${command.user.id})`;
    database.data.analytics[id].start = DateTime.now();
    database.data.analytics[id].user = `${user.tag} (${user.id})`;
    database.data.analytics[id].channel = `#${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})`;
    const results = await recursiveChannelClear(id, channel, user);
    database.data.analytics[id].duration = Interval.fromDateTimes(results.start, results.end).toDuration().toHuman();
    await database.write();
    log.debug(`[clear ${id}] deleted ${results.deletions} out of ${results.total} ${results.total == 1 ? "message" : "messages"} in ${database.data.analytics[id].duration}`);
    return await command.followUp({
        content: `done, deleted ${results.deletions} out of ${results.total} ${results.total == 1 ? "message" : "messages"} in ${database.data.analytics[id].duration}`,
        ephemeral: true,
    });
};
