const { glob } = require("glob");
const { promisify } = require("util");
const globPromise = promisify(glob);
const path = require("path");
const chalk = require("chalk");

module.exports = {
    name: "refreshcm",
    description: "🔁 Refresh and deploy slash commands from /SlashCommands folder.",
    run: async (client, message) => {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("⛔ You need Administrator permission to use this command.");
        }

        const msg = await message.reply("🔁 Starting slash command refresh...");

        try {
            const slashCommandsPath = path.join(__dirname, "../../SlashCommands/*/*.js");
            const slashCommands = await globPromise(slashCommandsPath);
            const total = slashCommands.length;
            const arrayOfSlashCommands = [];

            client.slashCommands.clear();

            let progressText = `🔁 Found ${total} slash commands.\n\n`;
            let count = 0;

            for (const filePath of slashCommands) {
                delete require.cache[require.resolve(filePath)];
                const file = require(filePath);

                if (!file?.name) continue;

                client.slashCommands.set(file.name, file);

                arrayOfSlashCommands.push({
                    name: file.name,
                    description: file.description || "No description provided.",
                    options: file.data?.options || [],
                    type: file.type || 1,
                });

                count++;
                progressText += `📦 Loaded ${count}/${total}: \`${file.name}\`\n`;

                if (count % 1 === 0) {
                    await msg.edit(progressText);
                }
            }

            progressText += `\n🚀 Deploying to guild...`;
            await msg.edit(progressText);

            const guild = client.guilds.cache.get(client.config.server.id);
            if (!guild) {
                return msg.edit("❌ Guild not found! Please check your configuration.");
            }

            await guild.commands.set([]);
            await guild.commands.set(arrayOfSlashCommands);

            progressText += `\n✅ Successfully deployed ${count} slash commands to **${guild.name}**!`;
            await msg.edit(progressText);

            console.log(chalk.green(`✅ Slash commands deployed: ${count}`));
        } catch (error) {
            console.error(chalk.red("❌ Error while refreshing slash commands:"), error);
            msg.edit("❌ An error occurred while refreshing slash commands. Check console.");
        }
    },
};
