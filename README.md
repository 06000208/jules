# clear

purpose built discord bot to clear messages

## envionrment variables

put these in a plain text `.env` file in same folder as the index.js or use them as environment variables

- `DISCORD_TOKEN=""`
  - your bot's discord token
- `DISCORD_GUILD_IDS=""`
  - ids of discord guilds that should have guild-exclusive commands deployed, in a single string, separated by commas. examples:
    - `"900000000000000000"`
    - `"900000000000000000, 900000000000000001"`
- `DISCORD_OWNER_IDS=""`
  - ids of discord users which may run restricted commands, in a single string, separated by commas. examples:
    - `"900000000000000000"`
    - `"900000000000000000, 900000000000000001"`