/* eslint-disable no-unused-vars */
import { ListenerBlock } from "@a06000208/handler";
import { log } from "../log.js";

export default [
    new ListenerBlock({ event: "debug" }, (debug) => log.trace(debug)),
    new ListenerBlock({ event: "warn" }, (warn) => log.warn(warn)),
    new ListenerBlock({ event: "error" }, (error) => log.error(error)),
    new ListenerBlock({ event: "ready" }, (client) => log.info(`${client.user.tag} is ready and serving ${client.guilds.cache.size} ${client.guilds.cache.size == 1 ? "guild" : "guilds"}`)),
    // Keep in mind hitting a rate limit (rateLimit event) isn't the same thing as being rate limited (err 429)
    new ListenerBlock({ event: "rateLimit" }, function(rateLimitInfo) {
        log.trace({ rateLimitInfo: rateLimitInfo }, `${this.user.tag} hit a rate limit, discord.js is delaying calls internally to respect it`);
    }),
    new ListenerBlock({ event: "guildUnavailable" }, (guild) => log.warn(`Guild ${guild.id} became unavailable`)),
    new ListenerBlock({ event: "shardError" }, (error, id) => log.error(`[Shard ${id}] ${error.message}`)),
    new ListenerBlock({ event: "shardReady" }, function(id, unavailableGuilds) {
        log.info(`[Shard ${id}] Shard is ready and serving ${this.user.tag}`);
    }),
    // Only emits when a shard's websocket won't try to reconnect
    new ListenerBlock({ event: "shardDisconnect" }, function(event, id) {
        if (event.code === 1000) {
            log.info(`[Shard ${id}] Websocket disconnected normally, ${event.reason} (${event.code})`);
        } else {
            log.error(`[Shard ${id}] Websocket disconnected abnormally, ${event.reason} (${event.code})`);
        }
    }),
    new ListenerBlock({ event: "shardReconnecting" }, (id) => log.warn(`[Shard ${id}] Websocket currently closed, attempting to reconnect...`)),
    new ListenerBlock({ event: "shardResume" }, (id, replayedEvents) => log.info(`[Shard ${id}] Resumed websocket connection, replayed ${replayedEvents} events`)),
];
