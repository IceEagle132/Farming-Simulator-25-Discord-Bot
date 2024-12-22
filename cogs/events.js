module.exports = {
    name: 'events',
    execute(client) {
        client.once('ready', () => {
            console.log(`Bot is ready as ${client.user.tag}`);
        });
    }
};