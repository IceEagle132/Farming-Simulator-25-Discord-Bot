import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load configuration file
with open("config.json", "r", encoding="utf-8") as config_file:
    config_data = json.load(config_file)

# Config values
STATS_URL = config_data["server"]["stats_url"]
ECONOMY_URL = config_data["server"]["economy_url"]
CAREER_SAVEGAME_URL = config_data["server"]["career_savegame_url"]
AUTO_UPDATE_CHANNEL_ID = int(config_data["channels"]["auto_update_channel_id"])
PRICES_CHANNEL_ID = int(config_data["channels"]["prices_channel_id"])
PLAYER_NOTIFICATIONS_CHANNEL_ID = int(config_data["channels"]["player_notifications_channel_id"])
STATUS_UPDATE_SECONDS = config_data["intervals"]["status_update_seconds"]
EVENT_MONITOR_SECONDS = config_data["intervals"]["event_monitor_seconds"]
CLEANUP_INTERVAL = config_data["intervals"]["cleanup_interval"]
SERVER_UPDATE_MESSAGE = config_data["messages"]["server_update"]
COMMON_FILL_TYPES = config_data["common_fill_types"]

# Bot token
BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("Bot token not found. Please set it in the .env file.")
