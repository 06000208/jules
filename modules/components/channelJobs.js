import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import { SnowflakeRegex } from "@sapphire/discord-utilities";
import { BaseGuildTextChannel, CommandInteraction } from "discord.js";
import { discord } from "../discord.js";
import { log } from "../log.js";
import { clear, describeBounds, save } from "./channelProcessing.js";
import { confirmAction } from "./confirmAction.js";
import { directory } from "../constants.js";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { hook } from "../webhook.js";
import { saveData } from "./dataCollection.js";

// not happy with most of this code but wanted to get it done
// it works perfectly well, just messy

let running = false;

/**
 * @typedef {Object} Job
 * @property {?string} comment - purposefully ignored
 * @property {?string} description - dynamically generated
 * @property {string} channel
 * @property {?string} user
 * @property {?string} after
 * @property {?string} before
 * @property {?boolean} clear
 * @property {?boolean} save
 * @property {?boolean} valid - dynamically determined
 */

/**
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */
const capCharacters = (text, limit) => text.length > limit ? text.substring(text, limit).concat("...") : text;

/**
 * Lazy but effective solution
 * @param {Job} job
 * @param {number} index
 * @return {Job}
 */
const validateJob = function(job, index) {
    if (!job) throw new TypeError("job cannot be falsy");
    job.valid = false;
    job.description = `${index}: `;
    if (!job?.channel) {
        job.description += "missing channel";
        return job;
    }
    if (typeof job.channel !== "string") {
        job.description += "invalid channel";
        return job;
    }
    const channel = discord.client.channels.resolve(job.channel);
    if (!channel) {
        job.description += "unresolvable channel";
        return job;
    }
    if (!job?.clear && !job?.save) {
        job.description += "invalid job type";
        return job;
    }
    if (job.after && !SnowflakeRegex.exec(job.after)?.groups?.id) {
        job.description += "invalid after";
        return job;
    }
    if (job.before && !SnowflakeRegex.exec(job.before)?.groups?.id) {
        job.description += "invalid before";
        return job;
    }
    if (job.before && job.after) {
        const afterSnowflake = DiscordSnowflake.deconstruct(job.after);
        const beforeSnowflake = DiscordSnowflake.deconstruct(job.before);
        if (afterSnowflake.timestamp > beforeSnowflake.timestamp) {
            job.description += "after cant be after before";
            return job;
        }
    }
    if (!job.user && job.clear) {
        job.description += "missing user";
        return job;
    }
    if (job.user && !SnowflakeRegex.exec(job.user)?.groups?.id) {
        job.description += "invalid user";
        return job;
    }

    // passed checks
    job.valid = true;
    job.description += `#${capCharacters(channel.name, 27)} `;
    if (job.user) job.description += `user ${job.user} `;
    if (job.after || job.before) {
        job.description += describeBounds(job.before, job.after);
    } else {
        job.description = job.description.trim();
    }
    return job;
};

/**
 * @param {ChatInputCommandInteraction} command
 */
export const jobsCommand = async function(command) {
    const type = command.options.getSubcommand();
    /**
     * @type {?{ pending: Job[] }}
     */
    let jobs = null;
    try {
        jobs = JSON.parse(await readFile(join(directory, "data", "jobs.json")));
    } catch (error) {
        log.error(`jobs.json could not be read: ${error.message}`);
        return await command.reply({
            content: `jobs.json could not be read: \`${error.message}\``,
            ephemeral: true,
        });
    }
    if (!jobs.pending) jobs.pending = [];
    if (type == "list") {
        /**
         * Optional channel parameter
         * @type {?BaseGuildTextChannel}
         */
        const channel = command.options.getChannel("channel");
        const pending = channel ? jobs.pending.filter((job) => job?.channel === channel.id) : jobs.pending;
        const list = pending.map((job, index) => validateJob(job, index).description);
        log.debug(`list of json defined jobs: \n${list.join("\n")}`);
        return await command.reply({
            content: "printed a list of all pending jobs to console",
            ephemeral: true,
        });
    } else if (type == "start") {
        // jobs already running
        if (running) {
            return await command.reply({
                content: "jobs are already in progress. to stop or abort jobs in progress, use `/quit`",
                ephemeral: true,
            });
        }
        // no jobs
        if (!jobs.pending.length) {
            return await command.reply({
                content: "no pending jobs to start",
                ephemeral: true,
            });
        }
        // validate & list jobs
        const parsed = jobs.pending.map((job, index) => validateJob(job, index));
        const validJobs = parsed.filter((job) => job.valid);
        const invalidJobs = parsed.length == validJobs.length ? [] : parsed.filter((job) => !job.valid);
        log.debug(`list of valid jobs: \n${validJobs.map((job) => job.description).join("\n")}`);
        log.debug(invalidJobs.length ? `list of invalid jobs: \n${invalidJobs.map((job) => job.description).join("\n")}` : "no invalid jobs detected");
        if (!validJobs.length) {
            return await command.reply({
                content: `no valid jobs to start, see console for a list of invalid jobs`,
                ephemeral: true,
            });
        }
        // confirmation
        const confirmation = await confirmAction(command, `are you sure you wish to run ${validJobs.length} json defined jobs, excluding ${invalidJobs.length} invalid jobs? please check the console for a complete list`);
        if (!confirmation) return;
        await command.editReply({
            content: `confirmed, starting to iterate over ${validJobs.length} jobs and run them`,
            components: [],
        });
        log.debug(`${command.user.tag} (${command.user.id}) authorized iterating over ${validJobs.length} jobs and running them`);
        running = true;
        for (const [index, job] of validJobs.entries()) {
            if (job.save && !saveData) {
                log.debug(`skipping job ${index}, saving isn't explictly enabled`);
                continue;
            }
            await wait(1000);
            /**
             * @type {BaseGuildTextChannel}
             */
            const channel = discord.client.channels.resolve(job.channel);
            if (!channel) {
                log.debug(`skipping job ${index}, unresolved channel`);
                continue;
            }
            if (!channel.guild || !channel.guild.available) {
                log.debug(`skipping job ${index}, falsy/unavailable guild`);
                continue;
            }
            const member = await channel.guild.members.fetch(job.user);
            if (job.clear) {
                if (!member) {
                    log.debug(`skipping clearing job ${index}, unresolved user`);
                    continue;
                }
                await clear(command.user, channel, member.user, job.save, job.before, job.after);
            } else if (job.save) {
                await save(command.user, channel, member.user, job.before, job.after);
            } else if (hook) {
                await hook.send({
                    content: `skipping job ${index}, inoperable, though that shouldn't be possible`,
                    username: discord.client.user.username,
                    avatarURL: discord.client.user.avatarURL({ format: "png" }),
                });
            }
        }
        running = false;
    } else {
        await command.reply({
            content: "unknown `/jobs` type",
            ephemeral: true,
        });
    }
};
