// cogs/serverStatus.js

const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const logger = require('../logger');
const config = require('../config.json');

const STATS_URL = config.server.stats_url; 
// e.g. "https://fsm25.davisfi.xyz/feed/dedicated-server-stats.xml?code=..."

module.exports = (client) => {
  // Run once on bot ready, and then periodically
  client.once('ready', async () => {
    logger.info('Server status updater is active.');

    // Immediately update on startup
    await updateServerStatus(client);

    // Update every 1 minute (60000 ms), or pick your own interval
    setInterval(async () => {
      await updateServerStatus(client);
    }, 60_000);
  });
};

// Fetch the server stats and update the Discord presence
async function updateServerStatus(client) {
  try {
    logger.info(`Fetching server stats from: ${STATS_URL}`);

    const response = await axios.get(STATS_URL, { timeout: 10_000 });
    if (!response.data.trim()) {
      throw new Error('Empty response from server stats URL.');
    }

    // Parse the XML
    const data = await parseStringPromise(response.data, { explicitArray: false });
    // data.Server should exist if the server is online

    if (!data?.Server?.Slots?.$) {
      throw new Error('Missing <Server> or <Slots> in the XML.');
    }

    // Example: <Slots capacity="16" numUsed="0">
    const numUsed = parseInt(data.Server.Slots.$.numUsed, 10);
    const capacity = parseInt(data.Server.Slots.$.capacity, 10);

    // Set presence, e.g. "0/16 players"
    const statusText = `${numUsed}/${capacity} players`;
    client.user.setActivity(statusText, { type: 3 }); // type 3 = "WATCHING", or you can use PLAYING, etc.
    logger.info(`Set status to "${statusText}"`);

  } catch (error) {
    logger.warn(`Server offline or failed to fetch stats: ${error.message}`);
    // If offline or error, set to "Server offline"
    client.user.setActivity('Server offline', { type: 3 });
  }
}