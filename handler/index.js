const { glob } = require("glob");
const { promisify } = require("util");
const { Client } = require("discord.js");
const globPromise = promisify(glob);

module.exports = async (client) => {
    try {
        // Commands
        const commandFiles = await globPromise(`${process.cwd()}/commands/**/*.js`);
        commandFiles.forEach((value) => {
            const file = require(value);
            const splitted = value.split("/");
            const directory = splitted[splitted.length - 2];

            if (file.name) {
                client.commands.set(file.name, { directory, ...file });
            }
        });

        // Events
        const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
        for (const file of eventFiles) {
        const event = require(file);
        if (typeof event === 'function') {
        event(client);
       }
     }



        // Slash Commands
        const slashCommands = await globPromise(`${process.cwd()}/SlashCommands/*/*.js`);
        const arrayOfSlashCommands = [];

        slashCommands.forEach((value) => {
            const file = require(value);
            if (!file?.name) return;
            client.slashCommands.set(file.name, file);

            arrayOfSlashCommands.push({
                name: file.name,
                description: file.description || "No description provided.",
                options: file.data?.options || [],
                type: file.type || 1,
            });
        });

        client.on("ready", async () => {
            try {
                const guild = client.guilds.cache.get(client.config.server.id);
                if (!guild) return console.error("❌ Guild not found! Check your guild ID.");

                console.log(`🔄 Refreshing slash commands for guild: ${client.config.server.id}`);
                await guild.commands.set([]); 
                await guild.commands.set(arrayOfSlashCommands);

                console.log("✅ Slash commands refreshed!");
            } catch (error) {
                console.error("❌ Error updating slash commands:", error);
            }
        });
    } catch (error) {
        console.error("❌ Error in command handler:", error);
    }
};
