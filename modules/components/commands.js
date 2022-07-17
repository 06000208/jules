import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "discord.js";

export const commands = [
    new SlashCommandBuilder().setName("about").setDescription("basic info about the bot"),
    new SlashCommandBuilder().setName("ping").setDescription("checks latency"),
    new SlashCommandBuilder().setName("exit").setDescription("exits process peacefully"),
].map(command => command.toJSON());

export const guildCommands = [
    new SlashCommandBuilder().setName("clear")
        .setDescription("clears a channel of messages from a user")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .addChannelOption(option => option.setName("channel").setDescription("Select a channel").setRequired(true))
        .addUserOption(option => option.setName("target").setDescription("Select a user").setRequired(true)),
].map(command => command.toJSON());
