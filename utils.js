const { parseStringPromise } = require('xml2js');
const logger = require('./logger');
const config = require('./config.json');
const axios = require('axios');


// Function to fetch XML with retry and exponential backoff
async function fetchXML(url, retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            logger.info(`Fetching XML from: ${url}`);
            const response = await axios.get(url, {
                timeout: 15000,  // Increase timeout to 15 seconds
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
                },
            });
            const data = await parseStringPromise(response.data);
            logger.debug(`XML fetched successfully from: ${url}`);
            return data;
        } catch (error) {
            if (error.response) {
                logger.error(`HTTP Error ${error.response.status} from ${url}`);
            } else if (error.request) {
                logger.warn(`Attempt ${i + 1} failed. No response from ${url}: ${error.message}`);
            } else {
                logger.error(`Error fetching XML: ${error.message}`);
            }

            // If retries remain, wait and try again
            if (i < retries - 1) {
                logger.info(`Retrying in ${delay / 1000} seconds...`);
                await new Promise((res) => setTimeout(res, delay));
                delay *= 2;  // Exponential backoff
            } else {
                logger.error("All retry attempts failed.");
            }
        }
    }
    return null;
}

// Fetch career savegame data
async function fetchCareerSavegame() {
    const savegameUrl = config.server.career_savegame_url;
    logger.info(`Fetching career savegame from: ${savegameUrl}`);
    return await fetchXML(savegameUrl);
}

// Export functions
module.exports = { 
    fetchXML,
    fetchCareerSavegame
};
