import { env } from "node:process";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { log } from "../log.js";
import { commands /* , guildCommands */ } from "../components/commandData.js";

const rest = new REST({ version: "9" }).setToken(env.discord_token);

if (!env.discord_client_id) throw new Error("cannot deploy commands without bot id");

try {
    log.info("Deploying commands...");
    await rest.put(Routes.applicationCommands(env.discord_client_id), { body: commands });
    log.info("Successfully deployed application commands");
    /*
    if (env.discord_guild_ids) {
        const guilds = env.discord_guild_ids.split(",").map((str) => str.trim());
        for (const id of guilds) {
            await rest.put(Routes.applicationGuildCommands(env.discord_client_id, id), { body: guildCommands });
        }
        log.info("Successfully deployed guild-specific application commands");
    }
    */
} catch (error) {
    console.error(error);
    log.error(
        { "error": error.name || null, "stack": error.stack || null },
        `an error occured deploying commands to discord, ${error.message || "no message"}`,
    );
}
