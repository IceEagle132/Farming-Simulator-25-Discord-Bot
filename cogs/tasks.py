import discord
from discord.ext import tasks, commands
from config import (
    STATS_URL,
    AUTO_UPDATE_CHANNEL_ID,
    PRICES_CHANNEL_ID,
    VEHICLE_REPLACEMENTS,
    STATUS_UPDATE_SECONDS,
    EVENT_MONITOR_SECONDS,
    CLEANUP_INTERVAL,
    SERVER_UPDATE_MESSAGE,
)
from utils import load_pinned_message_id, save_pinned_message_id, fetch_server_stats
from datetime import datetime, timedelta, timezone

class Tasks(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.pinned_message_id = load_pinned_message_id()
        self.tasks_started = False  # Flag to prevent starting tasks multiple times

    @commands.Cog.listener()
    async def on_ready(self):
        if not self.tasks_started:
            self.update_status.start()
            self.monitor_events.start()
            self.cleanup_messages.start()
            self.tasks_started = True
            print("Started all tasks.")

    def cog_unload(self):
        self.update_status.cancel()
        self.monitor_events.cancel()
        self.cleanup_messages.cancel()

    @tasks.loop(seconds=STATUS_UPDATE_SECONDS)
    async def update_status(self):
        try:
            stats_data = fetch_server_stats()
            if stats_data is None:
                return

            slots = stats_data.find("Slots").attrib
            players_online = int(slots.get("numUsed", "0"))
            player_capacity = slots.get("capacity", "N/A")

            activity = discord.Activity(
                type=discord.ActivityType.watching,
                name=f"{players_online}/{player_capacity} players online"
            )
            await self.bot.change_presence(activity=activity)
            print(f"Updated status to show {players_online}/{player_capacity} players online.")
        except Exception as e:
            print(f"Error in update_status: {e}")

    @update_status.before_loop
    async def before_update_status(self):
        await self.bot.wait_until_ready()

    @tasks.loop(seconds=EVENT_MONITOR_SECONDS)
    async def monitor_events(self):
        try:
            stats_data = fetch_server_stats()
            if stats_data is None:
                return

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
            channel = self.bot.get_channel(AUTO_UPDATE_CHANNEL_ID)
            if not channel:
                print(f"Channel with ID {AUTO_UPDATE_CHANNEL_ID} not found.")
                return

            if self.pinned_message_id:
                # Edit the existing message using its ID
                try:
                    pinned_message = await channel.fetch_message(self.pinned_message_id)
                    await pinned_message.edit(content=update_message)
                    return
                except discord.NotFound:
                    # Message ID is invalid; create a new pinned message
                    self.pinned_message_id = None

            # Create a new message and pin it if no valid message exists
            new_message = await channel.send(update_message)
            await new_message.pin()
            save_pinned_message_id(new_message.id)

        except Exception as e:
            print(f"Error in monitor_events: {e}")

    @monitor_events.before_loop
    async def before_monitor_events(self):
        await self.bot.wait_until_ready()

    @tasks.loop(seconds=CLEANUP_INTERVAL)
    async def cleanup_messages(self):
        try:
            channel = self.bot.get_channel(PRICES_CHANNEL_ID)
            if channel is None:
                print(f"Prices channel with ID {PRICES_CHANNEL_ID} not found.")
                return

            time_threshold = datetime.now(timezone.utc) - timedelta(minutes=1)

            # Fetch messages from the channel
            async for message in channel.history(limit=100):
                if message.pinned:
                    continue
                if message.created_at < time_threshold:
                    await message.delete()
            print(f"Cleaned up messages older than 1 minute in the prices channel.")
        except Exception as e:
            print(f"Error in cleanup_messages: {e}")

    @cleanup_messages.before_loop
    async def before_cleanup_messages(self):
        await self.bot.wait_until_ready()

async def setup(bot):
    await bot.add_cog(Tasks(bot))
