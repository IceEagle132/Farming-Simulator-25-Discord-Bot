import os
import json
import discord
from discord.ext import tasks, commands
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load configuration file
with open("config.json", "r", encoding="utf-8") as config_file:
    config = json.load(config_file)

# Config values
STATS_URL = config["server"]["stats_url"]
ECONOMY_URL = config["server"]["economy_url"]
AUTO_UPDATE_CHANNEL_ID = config["server"]["auto_update_channel_id"]
PRICES_CHANNEL_ID = config["channels"]["prices_channel_id"]
VEHICLE_REPLACEMENTS = config["replacements"]
STATUS_UPDATE_SECONDS = config["intervals"]["status_update_seconds"]
EVENT_MONITOR_SECONDS = config["intervals"]["event_monitor_seconds"]
CLEANUP_INTERVAL = config["cleanup_interval"]
SERVER_UPDATE_MESSAGE = config["messages"]["server_update"]
COMMON_FILL_TYPES = config["common_fill_types"]

# Define bot with intents
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="/", intents=intents)

# File to store pinned message ID
PINNED_MESSAGE_FILE = "pinned_message_id.txt"

@bot.event
async def on_ready():
    print(f"{bot.user} is online and ready!")
    await ensure_pinned_message()

    # Load pinned message ID
    pinned_message_id = load_pinned_message_id()

    # Start monitoring server events
    monitor_events.start(pinned_message_id)
    print("Started server event monitoring.")

    # Start updating bot status
    update_status.start()
    print("Started status updater.")

    # Start the cleanup task
    cleanup_messages.start()
    print("Started message cleanup task.")

async def ensure_pinned_message():
    """Ensure the pinned message in the prices channel is updated with the latest crop list."""
    channel = bot.get_channel(PRICES_CHANNEL_ID)
    if channel is None:
        print(f"Prices channel with ID {PRICES_CHANNEL_ID} not found.")
        return

    # Fetch the pinned messages in the channel
    pinned_messages = await channel.pins()

    # Prepare the updated crop list message
    fill_types_message = (
        "📋 **Available Crops for /prices**\n\n"
        + ", ".join(config["common_fill_types"])
        + "\n\nUse `/prices <crop>` to view the price history or best prices."
    )

    if pinned_messages:
        # Edit the existing pinned message
        pinned_message = pinned_messages[0]
        await pinned_message.edit(content=fill_types_message)
        print(f"Updated the pinned message in the prices channel.")
    else:
        # Pin a new message if no message is pinned
        message = await channel.send(fill_types_message)
        await message.pin()
        print(f"Pinned a new message in the prices channel.")

def load_pinned_message_id():
    try:
        with open(PINNED_MESSAGE_FILE, "r") as file:
            pinned_message_id = int(file.read())
            print(f"Loaded pinned message ID: {pinned_message_id}")
            return pinned_message_id
    except (FileNotFoundError, ValueError):
        return None

def save_pinned_message_id(message_id):
    with open(PINNED_MESSAGE_FILE, "w") as file:
        file.write(str(message_id))

@tasks.loop(seconds=STATUS_UPDATE_SECONDS)
async def update_status():
    """Update the bot's status with the current player count."""
    try:
        # Fetch server stats
        response = requests.get(STATS_URL)
        response.raise_for_status()
        stats_data = ET.fromstring(response.content)

        # Get player count
        slots = stats_data.find("Slots").attrib
        players_online = int(slots.get("numUsed", "0"))
        player_capacity = slots.get("capacity", "N/A")

        # Set the bot's status
        activity = discord.Activity(
            type=discord.ActivityType.watching,
            name=f"{players_online}/{player_capacity} players online"
        )
        await bot.change_presence(activity=activity)
        print(f"Updated status to show {players_online}/{player_capacity} players online.")
    except Exception as e:
        print(f"Error updating status: {e}")

@tasks.loop(seconds=EVENT_MONITOR_SECONDS)
async def monitor_events(pinned_message_id):
    """Monitor server for dynamic changes and update the pinned message."""
    try:
        # Fetch server stats
        response = requests.get(STATS_URL)
        response.raise_for_status()
        stats_data = ET.fromstring(response.content)

        # Extract relevant details
        server_name = stats_data.attrib.get("name", "N/A")
        map_name = stats_data.attrib.get("mapName", "N/A")
        slots = stats_data.find("Slots").attrib
        players_online = int(slots.get("numUsed", "0"))
        player_capacity = slots.get("capacity", "N/A")
        day_time = int(stats_data.attrib.get("dayTime", 0)) // 1000
        hours = day_time // 3600
        minutes = (day_time % 3600) // 60

        # Vehicles
        vehicles = stats_data.find("Vehicles").findall("Vehicle")
        vehicle_list = [
            f"{vehicle.attrib.get('name', 'Unknown')} ({VEHICLE_REPLACEMENTS.get(vehicle.attrib.get('type', 'Unknown Type'), vehicle.attrib.get('type', 'Unknown Type'))})"
            for vehicle in vehicles
        ]
        grouped_vehicles = "\n".join([", ".join(vehicle_list[i:i+3]) for i in range(0, len(vehicle_list), 3)])

        # Mods
        mods = stats_data.find("Mods").findall("Mod")
        mod_list = [mod.text.strip() if mod.text else "Unknown Mod" for mod in mods]
        grouped_mods = "\n".join([", ".join(mod_list[i:i+3]) for i in range(0, len(mod_list), 3)])

        # Prepare the update message
        update_message = SERVER_UPDATE_MESSAGE.format(
            server_name=server_name,
            map_name=map_name,
            players_online=players_online,
            player_capacity=player_capacity,
            hours=hours,
            minutes=minutes,
            vehicles=grouped_vehicles,
            mods=grouped_mods
        )

        # Get the update channel
        channel = bot.get_channel(AUTO_UPDATE_CHANNEL_ID)
        if not channel:
            print(f"Channel with ID {AUTO_UPDATE_CHANNEL_ID} not found.")
            return

        if pinned_message_id:
            # Edit the existing message using its ID
            try:
                pinned_message = await channel.fetch_message(pinned_message_id)
                await pinned_message.edit(content=update_message)
                return
            except discord.NotFound:
                # Message ID is invalid; create a new pinned message
                pinned_message_id = None

        # Create a new message and pin it if no valid message exists
        new_message = await channel.send(update_message)
        await new_message.pin()
        save_pinned_message_id(new_message.id)

    except Exception as e:
        print(f"Error monitoring events: {e}")

@tasks.loop(seconds=CLEANUP_INTERVAL)
async def cleanup_messages():
    """Periodically clean up old messages in the prices channel."""
    channel = bot.get_channel(PRICES_CHANNEL_ID)
    if channel is None:
        print(f"Prices channel with ID {PRICES_CHANNEL_ID} not found.")
        return

    # Set the time threshold (e.g., messages older than 5 minutes)
    from datetime import datetime, timedelta, timezone
    time_threshold = datetime.now(timezone.utc) - timedelta(minutes=1)

    try:
        # Fetch messages from the channel
        async for message in channel.history(limit=100):
            # Skip pinned messages
            if message.pinned:
                continue
            # Delete only if the message is older than the threshold
            if message.created_at < time_threshold:
                await message.delete()
        print(f"Cleaned up messages older than 1 minute in the prices channel.")
    except Exception as e:
        print(f"Error during cleanup: {e}")

def fetch_economy_data():
    """Fetch and parse the economy XML data."""
    try:
        response = requests.get(ECONOMY_URL)
        response.raise_for_status()
        return ET.fromstring(response.content)
    except Exception as e:
        print(f"Error fetching economy data: {e}")
        return None

@bot.command(name="prices")
async def prices(ctx, fill_type: str = None):
    """Fetch and display price history for a specific fill type."""
    # Ensure the command is only used in the specific channel
    if ctx.channel.id != PRICES_CHANNEL_ID:
        await ctx.send(f"Please use this command in <#{PRICES_CHANNEL_ID}>.")
        return

    # Handle no fill type provided
    if fill_type is None:
        common_fill_types = ", ".join(COMMON_FILL_TYPES)
        await ctx.send(f"Available fill types: {common_fill_types}")
        await ctx.message.delete()
        return

    # Fetch economy data
    economy_data = fetch_economy_data()
    if economy_data is None:
        await ctx.send("Error fetching economy data. Please try again later.")
        await ctx.message.delete()
        return

    # Extract price history
    price_history = extract_fill_type_prices(economy_data, fill_type.upper())
    await ctx.send(f"**{fill_type.upper()} Price History:**\n{price_history}")

    # Delete the user's command message
    await ctx.message.delete()

def extract_fill_type_prices(economy_data, fill_type_name):
    """Extract price history for a specific fill type."""
    fill_type = economy_data.find(f".//fillType[@fillType='{fill_type_name}']")
    if fill_type is None:
        return f"No data available for {fill_type_name}."

    history = fill_type.find("history")
    if history is None:
        return f"No history data available for {fill_type_name}."

    # Extract period and price data
    price_data = [
        (period.attrib["period"].replace("_", " ").title(), int(period.text))
        for period in history.findall("period")
    ]

    # Calculate high and low prices
    highest = max(price_data, key=lambda x: x[1])
    lowest = min(price_data, key=lambda x: x[1])

    # Format output
    formatted_data = "\n".join(
        [
            f"**{name}**: **${price}**" if (name, price) in [highest, lowest] else f"**{name}**: ${price}"
            for name, price in price_data
        ]
    )

    return (
        f"---\n"
        f"{formatted_data}\n"
        f"---\n"
        f"🔼 Highest: **{highest[0]} (${highest[1]})**\n"
        f"🔽 Lowest: **{lowest[0]} (${lowest[1]})**"
    )

# Load the bot token from the environment variable
bot_token = os.getenv("DISCORD_BOT_TOKEN")
if not bot_token:
    raise ValueError("Bot token not found. Please set it in the .env file.")

bot.run(bot_token)