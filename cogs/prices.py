import discord
from discord.ext import commands
from config import PRICES_CHANNEL_ID, COMMON_FILL_TYPES
from utils import fetch_economy_data, extract_fill_type_prices

class Prices(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="prices")
    async def prices(self, ctx, fill_type: str = None):
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

async def setup(bot):
    await bot.add_cog(Prices(bot))
