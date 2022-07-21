# clear

purpose built discord bot to clear messages

note that this uses [06000208/discord-framework](https://github.com/06000208/discord-framework) and [06000208/handler](https://github.com/06000208/discord-framework) as dependencies

## install

- install [nodejs](https://nodejs.org/) (minimum v16.6) and npm
  - as per the [install guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), npm comes with the [nodejs installers](https://nodejs.org/en/download/)
- [download the bot](https://github.com/06000208/clear/archive/refs/heads/main.zip) (direct download)
- run `npm install` in the same folder as `package.json`
- setup your .env file or environment variables as described below
- run `npm run deploy-commands` to deploy commands to discord
- run `npm run start` to start the bot

## envionrment variables

put these in a plain text `.env` file in same folder as index.js, or use them as environment variables, which is platform specific

```bash
# your bot's discord token
DISCORD_TOKEN=""
# your bot's discord id, used for deploying commands via REST api
DISCORD_ID=""
# ids of discord guilds that should have guild-exclusive commands deployed, in a single string, separated by commas
DISCORD_GUILD_IDS=""
# ids of discord users which may run restricted commands, in a single string, separated by commas
DISCORD_OWNER_IDS=""
```
