# jules

purpose built discord bot for administrative utilities, such as:

- deleting all messages from a user in a channel, optionally saving emojis
- saving emoji data from all messages in a channel, optionally filtered by user
- [configuring jobs via json](./JOBS.md)

for information on json defined jobs, see the linked markdown file

## install

- install [nodejs](https://nodejs.org/) (minimum v16.6) and npm
  - as per it's [guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), npm comes with the [nodejs installers](https://nodejs.org/en/download/)
- [download the bot](https://github.com/06000208/clear/archive/refs/heads/main.zip) (direct download)
- run `npm install` in the same folder as `package.json`
- if you don't have a bot account:
  - create an application in the [discord developer portal](https://discord.com/developers/applications)
  - navigate to your newly created application, select the "Bot" tab from the lefthand menu, and click "Add Bot" on the right
- setup your .env file or environment variables as described below
  - enable copying discord ids via context menu (right click) by opening discord's App Settings, the Advanced tab, and enabling Developer Mode
- run `npm run deploy-commands` to deploy commands to discord
- run `npm run start` to start the bot

## envionrment variables

put the following content in a plain text `.env` file in same folder as index.js and edit it as described, or use the names as environment variables, which is more tedious and platform specific

```bash
# your bot's discord token, used for logging in
DISCORD_TOKEN=""

# your bot's discord id, used for deploying commands via REST api
DISCORD_CLIENT_ID=""
```

additionally, there are some optional variables, which are needed for some functionality but may be omitted or set to an empty string (`EXAMPLE=` or `EXAMPLE=""`) if you do not wish to use them
```bash
# ids of discord users which may run restricted commands, in a single string, separated by commas
DISCORD_OWNER_IDS=""

# a webhook url to log when channel processing jobs (via json, /save, /clear) start and finish
# this is because bots have a time limit to respond to interactions
DISCORD_WEBHOOK_URL=""

# booleans that control what data is saved when using /save, or /clear with optional saving enabled
# must be explictly set to true as shown to be considered enabled, omitting it or any other value will be considered false
JULES_SAVE_EMOJIS=true
```

if editing your `.env` file with an ide, there may be an extension with syntax highlighting or language support:

- [visual studio code](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)
- [atom](https://atom.io/packages/language-dotenv)
- [sublime text](https://packagecontrol.io/packages/DotENV)

## code auditing

- note that this uses [06000208/discord-framework](https://github.com/06000208/discord-framework) and [06000208/handler](https://github.com/06000208/discord-framework) as dependencies
- all dependencies are listed in [package.json](./package.json)
- overviews of the changes between versions and their reasons may be found in the [changelog](./CHANGELOG.md) or [github releases](https://github.com/06000208/jules/releases)
