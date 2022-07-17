import { env } from "node:process";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { discord } from "./discord.js";
import { log } from "./log.js";
import { Permissions } from "discord.js";

const commands = [
    new SlashCommandBuilder().setName("about").setDescription("basic info about the bot"),
    new SlashCommandBuilder().setName("ping").setDescription("checks latency"),
    new SlashCommandBuilder().setName("exit").setDescription("exits process peacefully"),
].map(command => command.toJSON());

const guildCommands = [
    new SlashCommandBuilder().setName("clear")
        .setDescription("clears a channel of messages from a user")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .addChannelOption(option => option.setName("channel").setDescription("Select a channel"))
        .addUserOption(option => option.setName("target").setDescription("Select a user")),
].map(command => command.toJSON());

const rest = new REST({ version: "9" }).setToken(env.discord_token);

/**
 * Deploys commands
 * @returns {Promise<boolean>}
 */
const deploy = async function() {
    if (!discord.client.user) throw new Error("cannot deploy commands without bot id");
    try {
        log.info("Deploying commands...");
        await rest.put(Routes.applicationCommands(discord.client.user.id), { body: commands });
        log.info("Successfully deployed application commands");
        if (env.discord_guild_ids) {
            const guilds = env.discord_guild_ids.split(",").map((str) => str.trim());
            for (const id of guilds) {
                if (discord.client.guilds.cache.has(id)) {
                    await rest.put(Routes.applicationGuildCommands(discord.client.user.id, id), { body: guildCommands });
                }
            }
            log.info("Successfully deployed guild-specific application commands");
        }
    } catch (error) {
        console.error(error);
        log.error(
            { "error": error.name || null, "stack": error.stack || null },
            `an error occured deploying commands to discord, ${error.message || "no message"}`,
        );
        return false;
    }
    return true;
};

export {
    commands,
    guildCommands,
    deploy,
};
