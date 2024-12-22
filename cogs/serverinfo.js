// ./cogs/serverinfo.js

const { EmbedBuilder, TextChannel } = require('discord.js');
const axios = require('axios');
const { fetchCareerSavegame } = require('../utils');
const config = require('../config.json');
const fs = require('fs');
const logger = require('../logger');

const EMBED_TRACKER_PATH = './embedTracker.json';

// Safely add fields to embed with enhanced logging and validation
function addFieldSafe(embed, name, value, inline = true) {
    logger.debug(`Attempting to add field: ${name} - ${value}`);
    
    if (value && value !== 'undefined' && value !== '') {
        // Truncate if too long (Discord embed limits)
        if (name.length > 256) name = name.substring(0, 253) + '...';
        if (value.length > 1024) value = value.substring(0, 1021) + '...';

        embed.addFields({ 
            name: String(name).trim(), 
            value: String(value).trim(), 
            inline: inline 
        });
    } else {
        logger.warn(`Skipping empty or invalid field: ${name} - ${value}`);
    }
}

// Check if the server is online by pinging the savegame URL
async function isServerOnline() {
    try {
        const response = await axios.get(config.server.career_savegame_url, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Main function to post or update the embed
async function postOrUpdateEmbed(client) {
    logger.info('Checking for existing embed to update...');

    const channelId = config.channels.serverinfo_channel_id;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            logger.error(`Invalid channel: ${channelId}`);
            return;
        }
        logger.info(`Channel found: ${channel.name}`);

        // Server Status Check
        const serverOnline = await isServerOnline();
        const statusText = serverOnline ? '🟢 Online' : '🔴 Offline';
        const embedColor = serverOnline ? 0x2ecc71 : 0xe74c3c;

        // Fetch Savegame Data (if online)
        let savegameData = null;
        if (serverOnline) {
            savegameData = await fetchCareerSavegame();
        }

        if (!savegameData || !savegameData.careerSavegame) {
            logger.warn('Failed to fetch savegame data. Using fallback values.');
        }

        // Extract and format data
        const savegame = savegameData ? savegameData.careerSavegame : {};
        const settings = savegame.settings ? savegame.settings[0] : {};
        const statistics = savegame.statistics ? savegame.statistics[0] : {};

        const data = {
            mapTitle: settings.mapTitle || 'Unknown',
            savegameName: settings.savegameName || 'Unknown',
            saveDate: settings.saveDate || 'Unknown',
            creationDate: settings.creationDate || 'Unknown',
            economicDifficulty: settings.economicDifficulty || 'Normal',
            initialMoney: settings.initialMoney || '0',
            initialLoan: settings.initialLoan || '0',
            timeScale: settings.timeScale || '1.0',
            trafficEnabled: settings.trafficEnabled === 'true' ? 'Yes' : 'No',
            fruitDestruction: settings.fruitDestruction === 'true' ? 'Enabled' : 'Disabled',
            weedsEnabled: settings.weedsEnabled === 'true' ? 'Yes' : 'No',
            stonesEnabled: settings.stonesEnabled === 'true' ? 'Yes' : 'No',
            snowEnabled: settings.isSnowEnabled === 'true' ? 'Yes' : 'No',
            fuelUsage: settings.fuelUsage || '0',
            helperBuyFuel: settings.helperBuyFuel === 'true' ? 'Yes' : 'No',
            helperBuySeeds: settings.helperBuySeeds === 'true' ? 'Yes' : 'No',
            helperBuyFertilizer: settings.helperBuyFertilizer === 'true' ? 'Yes' : 'No',
            money: statistics.money || '0',
            playTime: statistics.playTime ? (statistics.playTime / 60).toFixed(1) : '0.0'
        };

        // Create Embed
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🌐 Farming Simulator - Server Info')
            .setDescription(`Server Status: **${statusText}**`)
            .setFooter({ text: 'Updated automatically every 10 minutes' })
            .setTimestamp();

        // Add fields with fallback
        addFieldSafe(embed, '🗺️ Map Name', data.mapTitle);
        addFieldSafe(embed, '💾 Savegame Name', data.savegameName);
        addFieldSafe(embed, '💾 Save Date', data.saveDate);
        addFieldSafe(embed, '🛠️ Creation Date', data.creationDate);
        addFieldSafe(embed, '⚙️ Difficulty', data.economicDifficulty);
        addFieldSafe(embed, '💰 Current Money', `$${parseInt(data.money || '0').toLocaleString()}`);
        addFieldSafe(embed, '⏳ Time Scale', `${data.timeScale}x`);
        addFieldSafe(embed, '🚦 Traffic Enabled', data.trafficEnabled);
        addFieldSafe(embed, '🌱 Weeds Enabled', data.weedsEnabled);
        addFieldSafe(embed, '🪨 Stones Enabled', data.stonesEnabled);
        addFieldSafe(embed, '❄️ Snow Enabled', data.snowEnabled);
        addFieldSafe(embed, '🌾 Fruit Destruction', data.fruitDestruction);
        addFieldSafe(embed, '⛽ Fuel Usage', data.fuelUsage);
        addFieldSafe(embed, '🕒 Playtime', `${data.playTime} hours`);
        addFieldSafe(embed, '🏦 Initial Loan', `$${parseInt(data.initialLoan || '0').toLocaleString()}`);
        addFieldSafe(embed, '💼 Initial Money', `$${parseInt(data.initialMoney || '0').toLocaleString()}`);
        addFieldSafe(embed, '👨‍🌾 Helper Buys Fuel', data.helperBuyFuel);
        addFieldSafe(embed, '🌾 Helper Buys Seeds', data.helperBuySeeds);
        addFieldSafe(embed, '💧 Helper Buys Fertilizer', data.helperBuyFertilizer);

        // Conditionally add Mod List if config.server.enable_mod_list is true
        if (config.server.enable_mod_list) {
            const modListUrl = config.server.mod_list_url || 'N/A';
            addFieldSafe(embed, '🗂️ Mod List', `[View Mods](${modListUrl})`, false);
        }

        // Conditionally add Server Password if config.server.enable_server_password is true
        if (config.server.enable_server_password) {
            const serverPassword = config.server.server_password || 'N/A';
            addFieldSafe(embed, '🔑 Server Password', `||${serverPassword}||`, false);
        }

        let embedTracker = {};
        if (fs.existsSync(EMBED_TRACKER_PATH)) {
            embedTracker = JSON.parse(fs.readFileSync(EMBED_TRACKER_PATH, 'utf-8'));
        }

        if (embedTracker.serverinfo_message_id) {
            const message = await channel.messages.fetch(embedTracker.serverinfo_message_id);
            await message.edit({ embeds: [embed] });
            logger.info(`Embed updated successfully: ${message.id}`);
        } else {
            const sentMessage = await channel.send({ embeds: [embed] });
            embedTracker.serverinfo_message_id = sentMessage.id;
            fs.writeFileSync(EMBED_TRACKER_PATH, JSON.stringify(embedTracker, null, 2));
            logger.info(`Embed posted: ${sentMessage.id}`);
        }
    } catch (error) {
        logger.error(`Failed to post or update embed: ${error.stack}`);
    }
}

// Export the function directly
module.exports = (client) => {
    client.once('ready', async () => {
        await postOrUpdateEmbed(client);
    });

    const updateInterval = config.intervals.serverinfo_update_minutes * 60 * 1000;
    setInterval(async () => {
        await postOrUpdateEmbed(client);
    }, updateInterval);
};