## [1.2.1](https://github.com/06000208/jules/releases/tag/1.2.1)

- fixed a crucial bug that caused an infinite loop
- made dataCollection aware that not all messages will have message content

## [1.2.0](https://github.com/06000208/jules/releases/tag/1.2.0)

- made using the webhook optional
- ensured the bot will crash on unhandled rejections, such as api errors
- added support for optional initial before and after bounds when iterating channels
- updated dependencies
- added quick and dirty support for json defined jobs
- fixed message content intent

## [1.1.0](https://github.com/06000208/jules/releases/tag/1.1.0)

- rebrand to jules
- updated changelogs
- made functionality more modular
- rewrote clear.js into channelProcessing.js with the addition of the /save command
- removed discord_guild_id variable
- renamed discord_id to discord_client_id
- rewrote channel parsing to use an iterative loop rather than function recursion, prevents stack call from increasing unnessecarily and more performant
- webhook for logging when saves/clears begin and finish since replying/following up to interactions is only valid for a short time
- various major and minor improvements across the bot

## [1.0.0](https://github.com/06000208/jules/releases/tag/1.0.0)

fully functional & not aware of any issues
