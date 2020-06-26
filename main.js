const os = require('os');
const axios = require('axios');
const moment = require('moment');
const {AWClient} = require('activity-watch-client');
const client = new AWClient('aw-watcher-harvest');
const config = require('./config.json') || {};

const hostname = os.hostname();
const bucketId = `aw-watcher-harvest_${hostname}`;
const bucketType = 'harvest.timer';
const updateInterval = config.updateInterval || 30000;
const pulseTime = updateInterval/1000 + 5; // pulsetime doesn't seem to matter much, because it will extend the previous event whenever it does a matching heartbeat.

const harvestUrl = "https://api.harvestapp.com/v2/time_entries?is_running=true"; // Get only the running timer
const harvestHeaders = config.harvestHeaders; // Authorization and Harvest-Account-Id; create a Personal Access Token as described at https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/ and put them in config.json

const pollHarvest = async () => {
    let response;
    try {
        response = await axios({
            url: harvestUrl,
            headers: harvestHeaders,
        });
    } catch(error) {
        console.log("Harvest request failed: ", error);
        return;
    }
    if(response && response.status === 200) {
        const runningTimer = response.data.time_entries[0];
        if(runningTimer) {
            return {
                id: runningTimer.id,
                // hours: runningTimer.hours, // this is always different of course... so it prevents it from merging events!
                timer_started_at: runningTimer.timer_started_at,
                client: runningTimer.client.name,
                project: runningTimer.project.name,
                task: runningTimer.task.name,
                notes: runningTimer.notes,
                // title is what shows up in the timeline (other custom fields are used for certain watchers -- https://github.com/ActivityWatch/aw-webui/blob/f9c0b40479a3b15514e889fd297c9164d6eac080/src/util/color.js#L62 )
                //title: runningTimer.notes,
                title: `${runningTimer.notes} :: ${runningTimer.project.name} (${runningTimer.client.name}) ${runningTimer.task.name}`,
            };
        }
    }
};

const update = async () => {
    const activeTask = await pollHarvest();
    console.log("activeTask", activeTask)
    if(activeTask) {
        const startTime = moment(activeTask.timer_started_at);
        const duration = moment().diff(startTime, 'seconds'); // number of seconds since startTime
        const event = {
            timestamp: startTime.toDate(),
            duration,
            data: activeTask,
        };
        console.log("event", event)
        return await client.heartbeat(bucketId, pulseTime, event);
    }
};

const initialize = () => client.ensureBucket(bucketId, bucketType, hostname);

const main = async () => {
    console.log("Initializing ActivityWatch client...");
    const initResult = await initialize();
    console.log("Initialized: ",initResult);
    const updateResult = await update();
    console.log("First update: ", updateResult);
    setInterval(update, updateInterval);
};

main().then(() => console.log("Started"), error => console.log("Error!", error));
