const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const client = require("../../index");
const Discord = require('discord.js');

module.exports = {
    name: 'activity',
    description: 'Activity System',
    run: async (client, message, args) => {
        if (message.member.roles.cache.some(r => r.name === client.config.server.perms)) {
            message.delete();

            const embed = new Discord.MessageEmbed()
                .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
                .setDescription('**Activity System**\n\n> Επιλέξτε μια από τις επιλογές για την υπηρεσία σας.')
                .setFooter({ text: 'Made by m4r1os' })
                .setColor(client.config.server.color);

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('select')
                    .setPlaceholder('Ορίστε την επιλογή που χρειάζεστε')
                    .addOptions([
                        {
                            label: 'Έναρξη υπηρεσίας',
                            emoji: client.config.server.emojis.online,
                            value: 'start',
                        },
                        {
                            label: 'Τέλος υπηρεσίας',
                            emoji: client.config.server.emojis.offline,
                            value: 'stop',
                        },
                        {
                            label: 'Συνολικές Ώρες',
                            emoji: client.config.server.emojis.totalhrs,
                            value: 'hours',
                        },
                        {
                            label: 'Leaderboard',
                            emoji: client.config.server.emojis.leaderbord,
                            value: 'leaderboard',
                        },
                    ])
            );

            message.channel.send({ embeds: [embed], components: [row] });
        } else {
            message.delete().catch(err => console.log(err));
        }
    },
};
