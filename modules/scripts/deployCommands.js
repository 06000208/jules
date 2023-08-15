import { env } from "node:process";
import { REST, Routes } from "discord.js";
import { log } from "../log.js";
import { commands /* , guildCommands */ } from "../components/commandData.js";

const rest = new REST({ version: "9" }).setToken(env.DISCORD_TOKEN);

if (!env.DISCORD_CLIENT_ID) throw new Error("Cannot deploy commands without bot id");

try {
    log.info("Deploying commands...");
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands });
    log.info("Successfully deployed application commands");
    /*
    if (env.DISCORD_GUILD_IDS) {
        const guilds = env.DISCORD_GUILD_IDS.split(",").map((str) => str.trim());
        for (const id of guilds) {
            await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, id), { body: guildCommands });
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
