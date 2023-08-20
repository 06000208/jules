import { env } from "node:process";
import { WebhookClient } from "discord.js";
import { WebhookRegex } from "@sapphire/discord-utilities";
import { log } from "./log.js";

const ThreadIdRegex = /\?thread_id=\d+$/;

/**
 * @param {?string} url
 * @returns {boolean}
 */
const validateWebhookUrl = function(url) {
    if (!url) return false;
    if (typeof url != "string") return false;
    const parsed = WebhookRegex.exec(ThreadIdRegex.test(url) ? url.substring(0, url.lastIndexOf("?thread_id=")) : url);
    return parsed?.groups?.url && parsed?.groups?.id && parsed?.groups?.token;
};

export const threadId = ThreadIdRegex.test(env.DISCORD_WEBHOOK_URL) ? env.DISCORD_WEBHOOK_URL.substring(env.DISCORD_WEBHOOK_URL.lastIndexOf("?thread_id=") + 11) : null;

/**
 * Optional webhook used throughout the bot
 *
 * If the `DISCORD_WEBHOOK_URL` envionrment variable is omitted, an empty
 * string, or fails to pass the regular expression, this will be null
 * @type {?WebhookClient}
 */
export const hook = validateWebhookUrl(env.DISCORD_WEBHOOK_URL) ? new WebhookClient({ url: env.DISCORD_WEBHOOK_URL }) : null;

/**
 * Convenience method so code elsewhere doesn't have to care if there is a thread_id parameter or not
 *
 * May be an easier way to do this but i don't care at the moment
 * @param  {...any} args
 */
export const threadIndifferentWebhookSend = async function(content) {
    if (!hook) return;
    if (threadId) {
        if (typeof content === "string") {
            return await hook.send({
                content: content,
                threadId: threadId,
            });
        } else {
            return await hook.send({
                ...content,
                threadId: threadId,
            });
        }
    } else {
        return await hook.send(content);
    }
};

log.info(hook ? "Instantiated webhook client" : "Webhook is disabled");
