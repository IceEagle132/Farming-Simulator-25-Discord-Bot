import discord
from discord.ext import commands
import config

# Define bot with intents
intents = discord.Intents.default()
intents.message_content = True

# List of initial extensions (cogs)
initial_extensions = ['cogs.events', 'cogs.prices', 'cogs.tasks']

# Create a subclass of commands.Bot
class MyBot(commands.Bot):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def setup_hook(self):
        # Load extensions asynchronously
        for extension in initial_extensions:
            await self.load_extension(extension)
        print("Extensions loaded.")

# Instantiate the bot
bot = MyBot(command_prefix="/", intents=intents)

@bot.event
async def on_ready():
    print(f"{bot.user} is online and ready!")

# Run the bot
bot.run(config.BOT_TOKEN)