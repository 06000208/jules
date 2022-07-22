import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "discord.js";

export const commands = [
    new SlashCommandBuilder().setName("about").setDescription("basic info about the bot"),
    new SlashCommandBuilder().setName("help").setDescription("alias for /about"),
    new SlashCommandBuilder().setName("ping").setDescription("checks latency"),
    new SlashCommandBuilder().setName("exit").setDescription("exits process peacefully"),
    new SlashCommandBuilder().setName("quit").setDescription("alias for /exit"),
    new SlashCommandBuilder().setName("guilds").setDescription("list of guilds"),
    new SlashCommandBuilder().setName("save")
        .setDescription("saves data from a channel")
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
        .addBooleanOption(option => option.setName("saving").setDescription("optional data saving").setRequired(false)),
].map(command => command.toJSON());

export const guildCommands = [];
