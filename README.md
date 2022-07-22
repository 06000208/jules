# jules

purpose built discord bot for administrative utilities, such as:

- deleting all messages from a user in a channel
- archival features

## install

- install [nodejs](https://nodejs.org/) (minimum v16.6) and npm
  - as per the [install guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), npm comes with the [nodejs installers](https://nodejs.org/en/download/)
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
# your bot's discord token
DISCORD_TOKEN=""

# your bot's discord id, used for deploying commands via REST api
DISCORD_CLIENT_ID=""

# ids of discord users which may run restricted commands, in a single string, separated by commas
DISCORD_OWNER_IDS=""

# booleans that control what data is saved when using either /save or /clear with optional saving enabled
# must be explictly set to true as shown to be considered enabled
JULES_SAVE_EMOJIS=true
JULES_SAVE_LINKS=false
JULES_SAVE_ATTACHMENTS=false
```

if editing using vsc, [this extension](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv) provides syntax highlighting for the dotenv file syntax

## code auditing

note that this uses [06000208/discord-framework](https://github.com/06000208/discord-framework) and [06000208/handler](https://github.com/06000208/discord-framework) as dependencies

all dependencies are listed in package.json
