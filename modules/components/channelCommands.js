import { SnowflakeRegex } from "@sapphire/discord-utilities";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { BaseGuildTextChannel, ChannelType, CommandInteraction, PermissionsBitField, User } from "discord.js";
import { log } from "../log.js";
import { clear, describeBounds, save } from "./channelProcessing.js";
import { confirmAction } from "./confirmAction.js";
import { saveData } from "./dataCollection.js";

/**
 * Save command
 * @param {CommandInteraction} command
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {?User} user Optional user parameter
 * @param {?string} before Discord id of the message *before* where you want processing to start
 * @param {?string} after Discord id of the message *after* where you want processing to end
 * @private
 */
const saveCommand = async function(command, channel, user, before, after) {
    if (!saveData) {
        return await command.reply({
            content: "unable to proceed, saving emojis is disabled",
            ephemeral: true,
        });
    }
    // ask for confirmation
    const confirmation = await confirmAction(command, `are you sure you wish to collect ${before || after ? "some" : "all"} emojis ${user ? `from ${user} (${user.tag}) in` : `from`} ${channel} ${describeBounds(before, after, channel)}?`);
    if (!confirmation) return;
    await command.editReply({
        content: `confirmed, collecting ${before || after ? "some" : "all"} emojis ${user ? `from ${user.tag} in` : `from`} ${channel} ${describeBounds(before, after, channel)}`,
        components: [],
    });
    await save(command.user, channel, user, before, after);
};

/**
 * Clear command
 * @param {CommandInteraction} command
 * @param {BaseGuildTextChannel} chnanel Required channel parameter
 * @param {User} user Required user parameter
 * @param {?string} before Discord id of the message *before* where you want processing to start
 * @param {?string} after Discord id of the message *after* where you want processing to end
 * @private
 */
const clearCommand = async function(command, channel, user, before, after) {
    /**
     * Optional boolean parameter
     * @type {null|boolean}
     */
    const saving = command.options.getBoolean("emojis");
    if (saving && !saveData) {
        return await command.reply({
            content: "unable to proceed with saving enabled, saving emojis is disabled",
            ephemeral: true,
        });
    }
    // ask for confirmation
    const confirmation = await confirmAction(command, `are you sure you wish to delete ${before || after ? "some" : "all"} messages from ${user} (${user.tag}) in ${channel} ${describeBounds(before, after, channel)}?`);
    if (!confirmation) return;
    await command.editReply({
        content: `confirmed, deleting ${before || after ? "some" : "all"} messages ${saving ? "and saving emojis" : "without saving emojis"} from ${user.tag} in ${channel} ${describeBounds(before, after, channel)}`,
        components: [],
    });
    await clear(command.user, channel, user, saving, before, after);
};

/**
 * Handles checks for both /save and /clear
 * @param {CommandInteraction} command
 */
export const channelCommand = async function(command) {
    /**
     * Required channel parameter
     * @type {BaseGuildTextChannel}
     */
    const channel = command.options.getChannel("channel");
    /**
     * Optional user parameter
     * @type {?User}
     */
    const user = command.options.getUser("user");
    /**
     * Optional after parameter
     * @type {?string}
     */
    const after = command.options.getString("after");
    /**
     * Optional before parameter
     * @type {?string}
     */
    const before = command.options.getString("before");
    // not sure if this can happen but might as well prevent it
    if (channel.type === ChannelType.DM) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} on dms`);
        return await command.reply({
            content: "this command may only be used on guild channels",
            ephemeral: true,
        });
    }
    // while someone needs manage messages to run the command, they might not
    // have it for the channel they select
    if (!channel.permissionsFor(command.user.id, true).has(PermissionsBitField.Flags.ManageMessages)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} without Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `you don't have permission to do this in ${channel}`,
            ephemeral: true,
        });
    }
    // bot also needs Manage Messages in the supplied channel
    if (!channel.permissionsFor(command.client.user.id, true).has(PermissionsBitField.Flags.ManageMessages)) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but the bot is missing Manage Messages in #${channel.name} (${channel.id})`);
        return await command.reply({
            content: `${command.client.user} is missing Manage Messages in ${channel}, can't proceed`,
            ephemeral: true,
        });
    }
    // if provided, validate after
    if (after && !SnowflakeRegex.exec(after)?.groups?.id) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but provided an invalid snowflake as after`);
        return await command.reply({
            content: `after parameter \`${typeof after == "string" ? after.substring(0, 20) : after}\` is not a valid snowflake, can't proceed`,
            ephemeral: true,
        });
    }
    // if provided, validate before
    if (before && !SnowflakeRegex.exec(before)?.groups?.id) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but provided an invalid snowflake as before`);
        return await command.reply({
            content: `before parameter \`${typeof before == "string" ? before.substring(0, 20) : before}\` is not a valid snowflake, can't proceed`,
            ephemeral: true,
        });
    }
    // ensure after doesn't take place after before
    if (before && after) {
        const afterSnowflake = DiscordSnowflake.deconstruct(after);
        const beforeSnowflake = DiscordSnowflake.deconstruct(before);
        if (afterSnowflake.timestamp > beforeSnowflake.timestamp) {
            log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but after can't be after before`);
            return await command.reply({
                content: `after parameter \`${typeof after == "string" ? after.substring(0, 20) : after}\` can't be after before parameter \`${typeof before == "string" ? before.substring(0, 20) : before}\`, can't proceed`,
                ephemeral: true,
            });
        }
    }
    switch (command.commandName) {
        case "clear":
            return await clearCommand(command, channel, user, before, after);
        case "save":
            return await saveCommand(command, channel, user, before, after);
    }
};
