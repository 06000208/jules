# json defined jobs

create a `jobs.json` file in /data/ with the following json data

```json
{
  "pending": []
}
```

next, create an object such as this:

```js
/**
 * @typedef {Object} Job
 * @property {?string} comment - optional string for labeling jobs
 * @property {string} channel - channel id
 * @property {?string} user - user id, required if clear: true, optional otherwise
 * @property {?string} after - message id, optional
 * @property {?string} before - message id, optional
 * @property {?boolean} clear - boolean, optional if save is present
 * @property {?boolean} save - boolean, optional if clear is present
 */
```
```json
{
  "comment": "",
  "channel": "",
  "user": "",
  "after": "",
  "before": "",
  "clear": true,
  "save": true
}
```

and add it to the pending array:

```json
{
  "pending": [
    {
      "channel": "111222333444555666",
      "user": "111222333444555666",
      "after": "111222333444555666",
      "before": "111222333444555666",
      "clear": true,
      "save": true
    }
  ]
}
```

to add multiple jobs, use commas between objects:

```json
{
  "pending": [
    {
      "comment": "general",
      "channel": "111222333444555666",
      "user": "111222333444555666",
      "after": "111222333444555666",
      "before": "111222333444555666",
      "clear": true,
      "save": true
    },
    {
      "comment": "memes",
      "channel": "111222333444555666",
      "user": "111222333444555666",
      "after": "111222333444555666",
      "before": "111222333444555666",
      "clear": true,
      "save": true
    },
    {
      "comment": "staff",
      "channel": "111222333444555666",
      "user": "111222333444555666",
      "after": "111222333444555666",
      "before": "111222333444555666",
      "clear": true,
      "save": true
    }
  ]
}
```

next, when your bot is up, use `/jobs list` to check your jobs or `/jobs start` to start them. both will validate your jobs and print a list of the valid and invalid jobs to the console

i recommend setting the `DISCORD_WEBHOOK_URL` environment variable either manually or via your `.env` file as this will allow you to monitor when channel processing starts and stops
