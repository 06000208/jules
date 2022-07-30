import { env, exit } from "node:process";
import { Discord } from "@a06000208/discord-framework";
import { Client, GatewayIntentBits } from "discord.js";
import { log } from "./log.js";
import { defaultPresence } from "./constants.js";
import { clientLogging, restLogging } from "./listeners/logging.js";
import interactionCreate from "./listeners/interactionCreate.js";
import { EventEmitterConstruct } from "@a06000208/handler";

/**
 * instantiate Discord instance, this includes the discord.js Client
 * @type {{client: Client, events: EventEmitterConstruct }}
 */
const discord = new Discord({
    /**
     * @type {import("discord.js").ClientOptions}
     */
    clientOptions: {
        presence: defaultPresence,
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
        allowedMentions: {
            parse: [],
            users: [],
            roles: [],
            repliedUser: false,
        },
    },
});

const restEvents = new EventEmitterConstruct(discord.client.rest);

// listeners
for (const listenerBlock of clientLogging) { discord.events.load(listenerBlock); }
for (const listenerBlock of restLogging) { restEvents.load(listenerBlock); }
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
