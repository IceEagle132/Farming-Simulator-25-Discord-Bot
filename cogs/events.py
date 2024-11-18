import discord
from discord.ext import commands
from config import PRICES_CHANNEL_ID, COMMON_FILL_TYPES
from utils import ensure_pinned_message

class Events(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        await ensure_pinned_message(self.bot)
        print("Pinned message ensured.")

async def setup(bot):
    await bot.add_cog(Events(bot))