const { fetchXML } = require('../utils');
const config = require('../config.json');

module.exports = {
    name: 'tasks',
    execute(client) {
        setInterval(async () => {
            const statsUrl = config.server.stats_url;
            const xmlData = await fetchXML(statsUrl);

            if (xmlData) {
                const playersOnline = xmlData.server.slots[0].$.numUsed;
                const playerCapacity = xmlData.server.slots[0].$.capacity;

                client.user.setActivity(`${playersOnline}/${playerCapacity} players online`, {
                    type: 'WATCHING'
                });
            }
        }, config.intervals.status_update_seconds * 1000);
    }
};