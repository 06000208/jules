import { env } from "node:process";
import { WebhookClient } from "discord.js";
import { WebhookRegex } from "@sapphire/discord.js-utilities";
import { log } from "./log.js";

if (!env.discord_webhook_url) throw new Error("Variable discord_webhook_url is unset");

const parsed = WebhookRegex.exec(env.discord_webhook_url);
if (!parsed.groups.url || !parsed.groups.id || !parsed.groups.token) throw new Error("The provided webhook url is invalid");

export const hook = new WebhookClient({
    url: env.discord_webhook_url,
});

log.info("Instantiated webhook client");
