import { SlashCommandBuilder } from "discord.js";
import { PermissionsBitField } from "discord.js";

export const commands = [
    new SlashCommandBuilder().setName("about").setDescription("basic info about the bot"),
    new SlashCommandBuilder().setName("help").setDescription("alias for /about"),
    new SlashCommandBuilder().setName("ping").setDescription("checks latency"),
    new SlashCommandBuilder().setName("quit").setDescription("exits process peacefully"),
    new SlashCommandBuilder().setName("exit").setDescription("alias for /quit"),
    new SlashCommandBuilder().setName("guilds").setDescription("list of guilds"),
    new SlashCommandBuilder().setName("estimate")
        .setDescription("list of guilds")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
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
    new SlashCommandBuilder().setName("jobs")
        .setDescription("manage json defined jobs")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false)
        /*
        .addSubcommand(subcommand => subcommand.setName("add").setDescription("adds a job")
            .addChannelOption(option => option.setName("channel").setDescription("channel").setRequired(true))
            .addStringOption(option => option.setName("name").setDescription("x").setRequired(false)),
        )
        .addSubcommand(subcommand => subcommand.setName("remove").setDescription("removes a job")
            .addChannelOption(option => option.setName("channel").setDescription("channel").setRequired(true)),
        )
        */
        .addSubcommand(subcommand => subcommand.setName("start").setDescription("starts running jobs"))
        .addSubcommand(subcommand => subcommand.setName("list").setDescription("list jobs")
            .addChannelOption(option => option.setName("channel").setDescription("jobs for a channel").setRequired(false)),
        ),
    new SlashCommandBuilder().setName("save")
        .setDescription("saves emojis from a channel")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false)
        .addChannelOption(option => option.setName("channel").setDescription("select a channel").setRequired(true))
        .addUserOption(option => option.setName("user").setDescription("user filter?").setRequired(false))
        .addStringOption(option => option.setName("after").setDescription("msg id after range").setRequired(false))
        .addStringOption(option => option.setName("before").setDescription("msg id before range").setRequired(false)),
    new SlashCommandBuilder().setName("clear")
        .setDescription("clears a channel of messages from a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false)
        .addChannelOption(option => option.setName("channel").setDescription("select a channel").setRequired(true))
        .addUserOption(option => option.setName("user").setDescription("select a user").setRequired(true))
        .addBooleanOption(option => option.setName("emojis").setDescription("save emojis?").setRequired(false))
        .addStringOption(option => option.setName("after").setDescription("msg id after range").setRequired(false))
        .addStringOption(option => option.setName("before").setDescription("msg id before range").setRequired(false)),
].map(command => command.toJSON());

export const guildCommands = [];
