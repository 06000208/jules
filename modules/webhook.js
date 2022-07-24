import { env } from "node:process";
import { WebhookClient } from "discord.js";
import { WebhookRegex } from "@sapphire/discord.js-utilities";
import { log } from "./log.js";

/**
 * @param {?string} url
 * @returns {boolean}
 */
const validateWebhookUrl = function(url) {
    if (!url) return false;
    if (typeof url != "string") return false;
    const parsed = WebhookRegex.exec(url);
    return parsed.groups.url && parsed.groups.id && parsed.groups.token;
};

/**
 * Optional webhook used throughout the bot
 *
 * If the `DISCORD_WEBHOOK_URL` envionrment variable is omitted, an empty
 * string, or fails to pass the regular expression, this will be null
 * @type {?WebhookClient}
 */
export const hook = validateWebhookUrl(env.discord_webhook_url) ? new WebhookClient({ url: env.discord_webhook_url }) : null;

log.info(hook ? "Instantiated webhook client" : "Webhook is disabled");
