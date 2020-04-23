# aw-watcher-harvest

A watcher for [ActivityWatch](https://activitywatch.net/) which tracks the currently running Harvest timer.

This is an initial release and not yet guaranteed to do anything useful.

To use it, create a Harvest personal access token on the [Harvest developer site](https://id.getharvest.com/developers), and add the token and account ID to a new `config.json` file looking like this:

```json
{
    "harvestHeaders": {
        "Authorization": "Bearer xxxxxxxxx",
        "Harvest-Account-Id": "yyyyy"
    }
}
```

Then run `node main.js` and leave it running. It will poll Harvest every 30 seconds (or whatever number of milliseconds you specify as `updateInterval` in `config.json`) and log the running timer, if any.

-Adam Coyne github@mail2.coyne.nu