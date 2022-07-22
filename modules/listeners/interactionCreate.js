/* eslint-disable no-unused-vars */
import { ListenerBlock } from "@a06000208/handler";
import { owners } from "../discord.js";
import { log } from "../log.js";
import { Interaction } from "discord.js";
import { ping, about, exit, guilds } from "../components/commands.js";
import { channelCommand } from "../components/channelProcessing.js";

export default new ListenerBlock({ event: "interactionCreate" }, /** @param {Interaction} interaction */ async function(interaction) {
    if (!interaction.isCommand()) return;
    if (!interaction.isRepliable()) return log.debug(`couldn't reply to a ${interaction.commandName} interaction`);
    // the 06000208/commands and 06000208/discord-framework packages are
    // too early in development to use for this rn, or else this wouldn't
    // use switch statements like this :P
    switch (interaction.commandName) {
        case "ping":
            return await ping(interaction);
        case "about":
        case "help":
            return await about(interaction);
    }
    if (!owners.includes(interaction.user.id)) {
        log.warn(`${interaction.user.tag} (${interaction.user.id}) tried to use /${interaction.commandName} but isn't authorized`);
        return await interaction.reply({
            content: "you lack authorization to use this command",
            ephemeral: true,
        });
    }
    switch (interaction.commandName) {
        case "guilds":
            return await guilds(interaction);
        case "quit":
        case "exit":
            return await quit(interaction);
        case "clear":
        case "save":
            return await channelCommand(interaction);
    }
});
