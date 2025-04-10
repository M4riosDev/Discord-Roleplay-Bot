const { Client, Collection } = require("discord.js");
const client = new Client({ intents: 32767 });
const mongoose = require('mongoose');

client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require("./configs/config");

require("./handler")(client);

mongoose.connect(client.config.DB.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Συνδέθηκε στη MongoDB"))
  .catch(err => console.error("❌ Σφάλμα σύνδεσης:", err));

module.exports = client;

client.login(client.config.bot.token);