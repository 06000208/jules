import { name, packageData, version } from "../constants.js";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { discord, owners } from "../discord.js";
import { log } from "../log.js";

/**
 * ping command
 * @param {CommandInteraction} command
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
 * @param {CommandInteraction} command
 */
export const about = async function(command) {
    const embed = new MessageEmbed();
    embed.setTitle(command.client.user.username);
    embed.setURL(`https://discord.com/api/oauth2/authorize?client_id=${command.client.user.id}&permissions=431644601408&scope=bot%20applications.commands`);
    embed.setDescription(`running [${name}](<${packageData.homepage}>) v${version}, for further info ${owners.length == 1 ? "contact" : "contact someone on this list:"} <@${owners.join(">, <@")}>`);
    embed.addField("Commands", "`/ping`, `/about`, `/exit`, `/guilds`, `/clear`", true);
    embed.addField("Note", "the `/exit`, /guilds, and `/clear` commands are restricted, and the last requires you to have Manage Messages to appear as an option");
    return await command.reply({
        embeds: [ embed ],
        ephemeral: true,
    });
};

/**
 * exit command
 * @param {CommandInteraction} command
 */
export const exit = async function(command) {
    // exit command
    log.info(`${command.user.tag} (${command.user.id}) used /exit, destroying client & exiting peacefully`);
    await command.reply({
        content: "exiting...",
        ephemeral: true,
    });
    discord.destroy();
    process.exit(0);
};

/**
 * exit command
 * @param {CommandInteraction} command
 */
export const guilds = async function(command) {
    log.debug(`${command.user.tag} (${command.user.id}) used /guilds`);
    await command.reply({
        content: command.client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`).join("\n"),
        ephemeral: true,
    });
};
