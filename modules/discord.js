import { env, exit } from "node:process";
import { Discord } from "@a06000208/discord-framework";
import { Intents } from "discord.js";
import { log } from "./log.js";
import { defaultPresence } from "./constants.js";
import logging from "./listeners/logging.js";
import interactionCreate from "./listeners/interactionCreate.js";

// instantiate Discord instance, this includes the discord.js Client
const discord = new Discord({
    /**
     * @type {import("discord.js").ClientOptions}
     */
    clientOptions: {
        presence: defaultPresence,
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
        ],
        allowedMentions: {
            parse: [],
            users: [],
            roles: [],
            repliedUser: false,
        },
    },
});

// listeners
for (const listenerBlock of logging) { discord.events.load(listenerBlock); }
discord.events.load(interactionCreate);

// bot owners
if (!env.discord_owner_ids) throw new Error("no discord user ids to treat as bot owners");
export const owners = env.discord_owner_ids.split(",").map((str) => str.trim());
log.info(`Authorized discord users: ${owners.join(", ")}`);

// login
try {
    await discord.login(env.discord_token);
} catch (error) {
    switch (error.message) {
        case "TOKEN_MISSING":
            log.fatal("no token was supplied, exiting");
            break;
        case "TOKEN_INVALID":
            log.fatal("the supplied token was invalid, exiting");
            break;
        case "TOKEN_INVALID_REGEX":
            log.fatal("the supplied token was invalid, exiting");
            break;
        default:
            log.fatal(
                { "error": error.name || null, "stack": error.stack || null },
                `an unknown issue with the token or signing in occured, ${error.message || "no message"}, see console for more information`,
            );
            console.error(error);
            break;
    }
    exit(1);
}

export { discord };
