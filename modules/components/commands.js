import { name, packageData, version } from "../constants.js";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { discord, owners } from "../discord.js";
import { log } from "../log.js";
import { DateTime } from "luxon";
import { Interval } from "luxon";
import humanizeDuration from "humanize-duration";

/**
 * ping command
 * @param {ChatInputCommandInteraction} command
 */
export const ping = async function(command) {
    const reply = await command.reply({
        content: "ping...",
        fetchReply: true,
    });
    return await command.editReply(`pong!\nresponding took roughly \`${reply.createdTimestamp - command.createdTimestamp}ms\`\naverage heartbeat is around \`${Math.round(command.client.ws.ping)}ms\``);
};

/**
 * about command
 * @param {ChatInputCommandInteraction} command
 */
export const about = async function(command) {
    const embed = new EmbedBuilder();
    embed.setTitle(command.client.user.username);
    embed.setURL(`https://discord.com/api/oauth2/authorize?client_id=${command.client.user.id}&permissions=431644601408&scope=bot%20applications.commands`);
    embed.setDescription(`running [${name}](<${packageData.homepage}>) source code v${version}, for further info ${owners.length == 1 ? "contact" : "contact someone on this list:"} <@${owners.join(">, <@")}>`);
    embed.addFields({
        name: "Note",
        value: "most commands are restricted and require you have Manage Messages to appear as an option",
    });
    return await command.reply({
        embeds: [ embed ],
        ephemeral: true,
    });
};

/**
 * quit command
 * @param {ChatInputCommandInteraction} command
 */
export const quit = async function(command) {
    // exit command
    log.info(`${command.user.tag} (${command.user.id}) used /quit, destroying client & exiting peacefully`);
    await command.reply({
        content: "quitting...",
        ephemeral: true,
    });
    discord.client.destroy();
    process.exit(0);
};

/**
 * exit command
 * @param {ChatInputCommandInteraction} command
 */
export const guilds = async function(command) {
    let list = command.client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`).join("\n") || "no guilds?";
    log.debug({ guilds: list }, `${command.user.tag} (${command.user.id}) used /guilds`);
    if (list.length > 1900) {
        list = list.substring(0, list.lastIndexOf("\n", 1900));
        list += `\nlist had to be truncated, see console or log file for the full list`;
    }
    await command.reply({
        content: list,
        ephemeral: true,
    });
};

/**
 * estimate
 * @param {ChatInputCommandInteraction} command
 */
export const estimate = async function(command) {
    const type = command.options.getSubcommand();
    const totalMessages = command.options.getInteger("total");
    const ephemeral = command.options.getBoolean("ephemeral");
    const start = DateTime.fromMillis(0);
    const timeToFetch = start.plus({ seconds: Math.round(totalMessages / 100) });
    let msg = `unknown /estimate type`;
    if (type === "save") {
        const savingInterval = Interval.fromDateTimes(start, timeToFetch);
        msg = `saving would take at least ${humanizeDuration(savingInterval.length("milliseconds"))}`;
    } else if (type === "clear") {
        const validMessages = command.options.getInteger("filtered") || 0;
        if (validMessages > totalMessages) {
            return command.reply({
                content: "valid messages can't be larger than the total messages",
                ephemeral: true,
            });
        }
        const timeToDelete = timeToFetch.plus({ seconds: validMessages * 8 });
        const deletingInterval = Interval.fromDateTimes(start, timeToDelete);
        msg = `clearing would take at least ${humanizeDuration(deletingInterval.length("milliseconds"))}`;
    }
    await command.reply({
        content: msg,
        ephemeral: ephemeral === false ? false : true,
    });
};
