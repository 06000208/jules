import { env, exit } from "node:process";
import { DiscordBot } from "@a06000208/discord-framework";
import { GatewayIntentBits } from "discord.js";
import { log } from "./log.js";
import { defaultPresence } from "./constants.js";
import { clientLogging, restLogging } from "./listeners/logging.js";
import interactionCreate from "./listeners/interactionCreate.js";
import { EventEmitterConstruct } from "@a06000208/handler";

/**
 * instantiate Discord instance, this includes the discord.js Client
 */
const discord = new DiscordBot({
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

// listeners
for (const listenerBlock of clientLogging) { discord.clientEvents.load(listenerBlock); }
for (const listenerBlock of restLogging) { discord.restEvents.load(listenerBlock); }
discord.clientEvents.load(interactionCreate);

// bot owners
if (!env.DISCORD_OWNER_IDS) throw new Error("no discord user ids to treat as bot owners");
export const owners = env.DISCORD_OWNER_IDS.split(",").map((str) => str.trim());
log.info(`Authorized discord users: ${owners.join(", ")}`);

// login
try {
    await discord.login(env.DISCORD_TOKEN);
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
