const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js');
const client = require("../../index");

module.exports = {
    name: 'ticket',
    description: 'Ticket System',
    run: async (client, message, args) => {
        if (message.member.roles.cache.some(r => r.name === client.config.server.perms)) {
            message.delete();

            const embed = new MessageEmbed()
                .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
                .setDescription('**```Παρακαλούμε να επιλέξετε το είδος του ticket που θέλετε να ανοίξετε, για την άμεση εξυπηρέτηση σας.```**')

                .setThumbnail(client.config.server.image)
                .setColor(client.config.server.color)
                .setFooter({ text: "Επιλέξτε από κάτω την κατηγορία για το Ticket. | Made by m4r1os" });
            const menu = new MessageSelectMenu()
                .setCustomId('ticket_menu')
                .setPlaceholder('Select a Ticket Type')
                .addOptions([
                    {
                        label: 'Support',
                        value: 'support',
                        emoji: client.config.server.emojis.support
                    },
                    {
                        label: 'Bug',
                        value: 'bug',
                        emoji: client.config.server.emojis.bug
                    },
                    {
                        label: 'Report',
                        value: 'report',
                        emoji: client.config.server.emojis.report
                    },
                    {
                        label: 'Free Civilian Job',
                        value: 'civilian',
                        emoji: client.config.server.emojis.civilianrl
                    },
                    {
                        label: 'Free Criminal Job',
                        value: 'criminal',
                        emoji: client.config.server.emojis.criminalrl
                    },
                    {
                        label: 'Other',
                        value: 'other',
                        emoji: client.config.server.emojis.other
                    }
                ]);

            const row = new MessageActionRow().addComponents(menu);

            message.channel.send({ embeds: [embed], components: [row] });
        } else {
            message.delete().catch(err => console.log(err));
        }
    }
};
