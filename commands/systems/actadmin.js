const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const client = require("../../index");
const Discord = require('discord.js');

module.exports = {
    name: 'actadmin',
    description: 'Managment Panel For Activity System',
    run: async (client, message, args) => {
        if(message.member.roles.cache.some(r => r.name === client.config.server.perms)){
            message.delete();

            const embed = new Discord.MessageEmbed()
                .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
                .setDescription('Staff Manager Menu For Duty System')
                .setColor(client.config.server.color)
                .setFooter({ text: 'Made by m4r1os' });

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('select')
                        .setPlaceholder('Ορίστε την επιλογή που χριάζεστε')
                        .addOptions([
                             {
                                label: 'Force Stop υπηρεσίας.',
                                emoji: '❌',
                                value: 'force-stop',
                            },
                            {
                                label: 'Clear Activity',
                                emoji: '🧹',
                                value: 'clear-activity',
                            },
                            {
                                label: 'πρόσθεση ωρών',
                                emoji: '➕',
                                value: 'add-hours',
                            },
                             {
                                label: 'Διαγραφή Ωρών',
                                emoji: '➖',
                                value: 'remove-hours',
                            }
                        ]),
                );

            message.channel.send({ embeds: [embed], components: [row] });
        } else {        
            message.delete().catch(err => console.log(err));
        }
    }
};