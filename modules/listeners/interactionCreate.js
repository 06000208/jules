/* eslint-disable no-unused-vars */
import { ListenerBlock } from "@a06000208/handler";
import { owners, discord } from "../discord.js";
import { log } from "../log.js";
import { clear } from "../components/clear.js";
import { packageData, version } from "../constants.js";
import { MessageEmbed } from "discord.js";

export default new ListenerBlock({ event: "interactionCreate" }, async function(interaction) {
    if (!interaction.isCommand()) return;
    if (!interaction.isRepliable()) return log.debug(`couldn't reply to a ${interaction.commandName} interaction`);
    // the 06000208/commands and 06000208/discord-framework packages are too
    // early in development to use here, or else this wouldn't be an if/else
    // chain :P
    if (interaction.commandName === "ping") {
        // ping command
        const reply = await interaction.reply({
            content: "ping...",
            fetchReply: true,
        });
        return await interaction.editReply(`pong!\nresponding took roughly \`${reply.createdTimestamp - interaction.createdTimestamp}ms\`\naverage heartbeat is around \`${Math.round(this.ws.ping)}ms\``);
    } else if (interaction.commandName === "about" || interaction.commandName === "help") {
        // info command
        const embed = new MessageEmbed();
        embed.setTitle(this.user.username);
        embed.setURL(`https://discord.com/api/oauth2/authorize?client_id=${this.user.id}&permissions=431644601408&scope=bot%20applications.commands`);
        embed.setDescription(`running [clear](<${packageData.homepage}>) v${version}, for further info contact <@${owners.join(">, <@")}>`);
        embed.addField("Commands", "`/ping`, `/about`, `/exit`, `/clear`", true);
        embed.addField("Note", "the `/exit` and `/clear` commands are restricted, and the latter requires you to have Manage Messages to appear as an option");
        return await interaction.reply({
            embeds: [ embed ],
            ephemeral: true,
        });
    } else if (!owners.includes(interaction.user.id)) {
        // this is checked prior to checking if the command is one of the
        // restricted commands, effectively preventing them from being used
        log.debug(`${interaction.user.username} (${interaction.user.id}) tried to use /${interaction.commandName}`);
        return await interaction.reply({
            content: "you lack authorization to use this command",
            ephemeral: true,
        });
    } else if (interaction.commandName === "exit") {
        // exit command
        await interaction.reply({
            content: "exiting...",
            ephemeral: true,
        });
        discord.destroy();
        process.exit(0);
    } else if (interaction.commandName === "clear") {
        // clear command
        return await clear(interaction);
    }
});

