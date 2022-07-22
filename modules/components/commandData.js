import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "discord.js";

export const commands = [
    new SlashCommandBuilder().setName("about").setDescription("basic info about the bot"),
    new SlashCommandBuilder().setName("help").setDescription("alias for /about"),
    new SlashCommandBuilder().setName("ping").setDescription("checks latency"),
    new SlashCommandBuilder().setName("quit").setDescription("exits process peacefully"),
    new SlashCommandBuilder().setName("exit").setDescription("alias for /quit"),
    new SlashCommandBuilder().setName("guilds").setDescription("list of guilds"),
    new SlashCommandBuilder().setName("estimate")
        .setDescription("list of guilds")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .setDMPermission(false)
        .addSubcommand(subcommand => subcommand.setName("clear").setDescription("estimate clearing")
            .addIntegerOption(option => option.setName("total").setDescription("total messages in a channel").setRequired(true))
            .addIntegerOption(option => option.setName("filtered").setDescription("total messages from a user").setRequired(true))
            .addBooleanOption(option => option.setName("ephemeral").setDescription("default true").setRequired(false)),
        )
        .addSubcommand(subcommand => subcommand.setName("save").setDescription("estimate saving")
            .addIntegerOption(option => option.setName("total").setDescription("total messages in a channel").setRequired(true))
            .addBooleanOption(option => option.setName("ephemeral").setDescription("default true").setRequired(false)),
        ),
    new SlashCommandBuilder().setName("save")
        .setDescription("saves emojis from a channel")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .setDMPermission(false)
        .addChannelOption(option => option.setName("channel").setDescription("select a channel").setRequired(true))
        .addUserOption(option => option.setName("user").setDescription("optional user filter").setRequired(false)),
    new SlashCommandBuilder().setName("clear")
        .setDescription("clears a channel of messages from a user")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .setDMPermission(false)
        .addChannelOption(option => option.setName("channel").setDescription("select a channel").setRequired(true))
        .addUserOption(option => option.setName("user").setDescription("select a user").setRequired(true))
        .addBooleanOption(option => option.setName("emojis").setDescription("optional emojis saving").setRequired(false)),
].map(command => command.toJSON());

export const guildCommands = [];
