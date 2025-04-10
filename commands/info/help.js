const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "help",
    description: "📚 Εμφανίζει το help menu",
    aliases: ["commands"],

    run: async (client, message) => {
        const foldersToRead = [
            path.join(__dirname, "../"),
            path.join(__dirname, "../../SlashCommands")
        ];

        let categories = [];

        for (const baseFolder of foldersToRead) {
            if (!fs.existsSync(baseFolder)) continue;

            const items = fs.readdirSync(baseFolder);

            for (const item of items) {
                const fullPath = path.join(baseFolder, item);
                const isDir = fs.lstatSync(fullPath).isDirectory();

                if (isDir) {
                    categories.push({ name: item, fullPath });
                } else if (item.endsWith(".js")) {
                    categories.push({ name: path.basename(baseFolder), fullPath: baseFolder });
                    break;
                }
            }
        }

        const menu = new MessageSelectMenu()
            .setCustomId("help_menu")
            .setPlaceholder("📂 Επίλεξε κατηγορία...")
            .addOptions(categories.map(cat => ({
                label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
                value: cat.fullPath,
                emoji: "📁"
            })));

        const row = new MessageActionRow().addComponents(menu);

        const embed = new MessageEmbed()
            .setTitle("📚 Βοήθεια")
            .setDescription("Επίλεξε μια κατηγορία για να δεις τις εντολές της.")
            .setImage(client.config.server.image)
            .setFooter({ text: 'Made by m4r1os' })
            .setColor(client.config.server.color);

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({
            componentType: "SELECT_MENU",
            time: 60000
        });

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "⛔ Δεν μπορείς να χρησιμοποιήσεις αυτό το μενού.", ephemeral: true });
            }

            const selectedPath = interaction.values[0];
            const commandFiles = fs.readdirSync(selectedPath).filter(file => file.endsWith(".js"));

            const cmds = commandFiles.map(file => {
                const cmd = require(path.join(selectedPath, file));
                return `• \`${cmd.name}\` - ${cmd.description || "Χωρίς περιγραφή"}`;
            });

            const catName = path.basename(selectedPath);
            const categoryEmbed = new MessageEmbed()
                .setTitle(`📂 ${catName.charAt(0).toUpperCase() + catName.slice(1)}`)
                .setDescription(cmds.join("\n") || "Δεν υπάρχουν εντολές σε αυτήν την κατηγορία.")
                .setColor(client.config.server.color || "#2F3136");

            await interaction.update({ embeds: [categoryEmbed] });
        });

        collector.on("end", () => {
            if (msg.editable) {
                msg.edit({ components: [] }).catch(() => {});
            }
        });
    }
};
