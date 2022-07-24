import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import { log } from "../log.js";

/**
* Used to confirm an action via buttons before proceeding
* @param {CommandInteraction} command
* @param {string} action
* @return {Promise<boolean>}
*/
export const confirmAction = async function(command, action) {
    /**
    * Message sent as an inital reply
    * @type {Message}
    */
    const confirmationPrompt = await command.reply({
        content: action,
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle("SECONDARY"),
            ),
        ],
        ephemeral: true,
        fetchReply: true,
    });
    /**
    * Button interaction used for confirming or cancelling
    * @type {?ButtonInteraction}
    */
    let button = null;
    try {
        button = await confirmationPrompt.awaitMessageComponent({
            /**
            * @param {ButtonInteraction} interaction
            */
            filter: (interaction) => interaction.user.id === command.user.id,
            componentType: "BUTTON",
            time: 60 * 1000,
        });
    } catch (error) {
        log.debug(`${command.user.tag} (${command.user.id}) tried to use /${command.commandName} but didn't confirm within 1 minute`);
    }
    if (!button) {
        await command.editReply({
            content: `didn't confirm within 1 minute, cancelled`,
            components: [],
        });
        return false;
    }
    // according to discord's developer documentation, it should be fine to
    // defer buttons as an initial response and never follow up
    button.deferUpdate();
    const confirmation = button.customId === "yes";
    if (!confirmation) {
        await command.editReply({
            content: `okay, cancelled`,
            components: [],
        });
    }
    return confirmation;
};
