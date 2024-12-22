const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const logger = require('./logger');
const config = require('./config.json');

async function fetchXML(url) {
    try {
        logger.info(`Fetching XML from: ${url}`);
        const response = await axios.get(url, { timeout: 10000 });
        const data = await parseStringPromise(response.data);
        logger.debug(`XML fetched successfully from: ${url}`);
        return data;
    } catch (error) {
        if (error.response) {
            logger.error(`HTTP Error ${error.response.status} from ${url}`);
        } else if (error.request) {
            logger.error(`No response from ${url}: ${error.message}`);
        } else {
            logger.error(`Error fetching XML: ${error.message}`);
        }
        return null;
    }
}

// Fetch career savegame data
async function fetchCareerSavegame() {
    const savegameUrl = config.server.career_savegame_url;
    logger.info(`Fetching career savegame from: ${savegameUrl}`);
    return await fetchXML(savegameUrl);
}

// Export both functions
module.exports = { 
    fetchXML,
    fetchCareerSavegame
};