const { Client, Collection } = require("discord.js");
const client = new Client({ intents: 32767 });
const mongoose = require('mongoose');
const express = require('express'); 
const app = express(); 

client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require("./configs/config");

require("./handler")(client);

// MongoDB Connection with improved error handling
mongoose.connect(client.config.DB.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Συνδέθηκε στη MongoDB");
}).catch(err => {
    console.error("❌ Σφάλμα σύνδεσης MongoDB:", err);
    process.exit(1);
});

// Express server for uptime monitoring
app.get('/', (req, res) => {
    res.json({
        status: '✅ Bot is alive!',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        guilds: client.guilds?.cache?.size || 0,
        users: client.users?.cache?.size || 0
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        discord: client.readyAt ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 1032; 
app.listen(PORT, () => {
    console.log(`🌐 Uptime server running on port ${PORT}`);
});

// Bot login with error handling
client.login(client.config.bot.token).catch(err => {
    console.error("❌ Σφάλμα σύνδεσης Discord:", err);
    process.exit(1);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = client;