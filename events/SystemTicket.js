const Discord = require('discord.js');
const fs = require('fs');
const moment = require('moment-timezone');
const discordTranscripts = require('discord-html-transcripts');
const client = require('../index');

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isSelectMenu() && interaction.customId === 'ticket_menu') {
            const selectedValue = interaction.values[0];
            const maxTickets = 3;

            await interaction.guild.channels.fetch();

            const allUserTickets = interaction.guild.channels.cache.filter(channel =>
                channel.topic?.startsWith(interaction.user.id)
            );
            if (allUserTickets.size >= maxTickets) {
                return interaction.reply({
                    content: 'Έχετε φτάσει το όριο των ενεργών εισιτηρίων σας.',
                    ephemeral: true,
                });
            }

            const categoryMapping = {
                support: client.config.ticket.categories.support,
                bug: client.config.ticket.categories.bug,
                report: client.config.ticket.categories.report,
                criminal: client.config.ticket.categories.Criminalct,
                civilian: client.config.ticket.categories.Civilianct,
                other: client.config.ticket.categories.other
            };

            const roleMapping = {
                support: client.config.ticket.roles.support,
                bug: client.config.ticket.roles.bug,
                report: client.config.ticket.roles.report,
                criminal: client.config.ticket.roles.Criminalrl,
                civilian: client.config.ticket.roles.Civilianrl,
                other: client.config.ticket.roles.other
            };

            const embedDescriptionMapping = (interaction) => {
                const username = interaction.member?.nickname || interaction.user?.username || "Άγνωστος Χρήστης";
                return {
                    support: `> ${username} Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατόν για την υποστήριξή σας.`,
                    bug: `> ${username} Παρακαλώ περιγράψτε μας το πρόβλημά σας για να μπορέσουμε να σας βοηθήσουμε.`,
                    report: `Ευχαριστούμε που κάνατε αναφορά, ${username}. Ένας διαχειριστής θα το εξετάσει σύντομα.`,
                    other: `> Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατόν.`,
                    civilian: `> ${username} Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατόν για το θέμα του Free Civilian Job.`,
                    criminal: `> ${username} Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατόν για το θέμα του Free Criminal Job.`
                };
            };

            const embedDescriptions = embedDescriptionMapping(interaction);
            const selectedCategory = categoryMapping[selectedValue] || client.config.ticket.defaultCategory;
            const mentionRole = roleMapping[selectedValue] || client.config.server.roles.default;
            const embedDescription = embedDescriptions[selectedValue] || 'Ευχαριστούμε που δημιουργήσατε εισιτήριο. Ένας διαχειριστής θα σας απαντήσει σύντομα.';


            interaction.guild.channels.create(`${selectedValue}-${interaction.user.username}`, {
                parent: selectedCategory,
                topic: `${interaction.user.id}|${selectedCategory}`,
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                    },
                    {
                        id: mentionRole,
                        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                    },
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                ],
                type: 'GUILD_TEXT',
            }).then(async (c) => {
                interaction.reply({
                    content: `Το εισιτήριο δημιουργήθηκε! <#${c.id}>`,
                    ephemeral: true,
                });

                const embed = new Discord.MessageEmbed()
                    .setColor(client.config.server.color)
                    .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
                    .setDescription(embedDescription)
                    .setTimestamp();

                const row = new Discord.MessageActionRow().addComponents(
                    new Discord.MessageButton()
                        .setCustomId('close-ticket')
                        .setLabel('Κλείσιμο εισιτηρίου')
                        .setEmoji('🔒')
                        .setStyle('DANGER'),
                    new Discord.MessageButton()
                        .setCustomId('claim-ticket')
                        .setLabel('Claim Ticket')
                        .setEmoji('🛠️')
                        .setStyle('PRIMARY')
                );

                await c.send({
                    content: `<@${interaction.user.id}> <@&${mentionRole}>`,
                    embeds: [embed],
                    components: [row],
                });

                c.creationTimestamp = Date.now();
            });
        }

        if (interaction.isButton() && interaction.customId === 'claim-ticket') {
            const chan = interaction.channel;
            const staffRoleId = client.config.server.roles.staff;
            const member = interaction.member;

            if (!member.roles.cache.has(staffRoleId)) return;

            const creatorId = chan.topic?.split('|')[0];
            const creatorMention = `<@${creatorId}>`;
            const staffMention = `<@&${staffRoleId}>`;

            let newButton;
            let messageContent;

            if (chan.claimedBy && chan.claimedBy === interaction.user.tag) {
                await chan.permissionOverwrites.edit(interaction.user.id, { VIEW_CHANNEL: false, SEND_MESSAGES: false });
                chan.claimedBy = null;
                chan.claimTimestamp = null;

                messageContent = `${creatorMention} ${staffMention}`;
                newButton = new Discord.MessageButton()
                    .setCustomId('claim-ticket')
                    .setLabel('Claim Ticket')
                    .setEmoji('🛠️')
                    .setStyle('PRIMARY');
            } else if (!chan.claimedBy) {
                await chan.permissionOverwrites.edit(interaction.user.id, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
                chan.claimedBy = interaction.user.tag;
                chan.claimTimestamp = Date.now();

                messageContent = `Εγινε claim από τον/την <@${interaction.user.id}>.`;
                newButton = new Discord.MessageButton()
                    .setCustomId('claim-ticket')
                    .setLabel('Unclaim Ticket')
                    .setEmoji('🛠️')
                    .setStyle('PRIMARY');
            } else {
                return interaction.reply({ content: 'Αυτό το εισιτήριο έχει ήδη αναληφθεί.', ephemeral: true });
            }

            const claimRow = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Κλείσιμο εισιτηρίου')
                    .setEmoji('🔒')
                    .setStyle('DANGER'),
                newButton
            );

            await interaction.message.edit({ content: messageContent, components: [claimRow] });
            return interaction.deferUpdate();
        }

        if (interaction.isButton() && interaction.customId === 'close-ticket') {
            const chan = interaction.channel;

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId('confirm-close')
                    .setLabel('Κλείσιμο εισιτηρίου')
                    .setStyle('DANGER'),
                new Discord.MessageButton()
                    .setCustomId('no')
                    .setLabel('Ακύρωση κλεισίματος')
                    .setStyle('SECONDARY')
            );

            await interaction.reply({
                content: 'Είστε βέβαιοι ότι θέλετε να κλείσετε το εισιτήριο;',
                components: [row],
            });

            const collector = chan.createMessageComponentCollector({
                componentType: 'BUTTON',
                time: 10000,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'confirm-close') {
                    collector.stop();

                    await chan.setParent(client.config.ticket.closedCategory, { lockPermissions: false });
                    await chan.edit({
                        name: `closed-${chan.name}`,
                        permissionOverwrites: [
                            {
                                id: chan.topic?.split('|')[0],
                                deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                            },
                            {
                                id: client.config.server.roles.staff,
                                allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                            },
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: ['VIEW_CHANNEL'],
                            },
                        ],
                    });

                    const reopenRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId('reopen-ticket')
                            .setLabel('Άνοιγμα ξανά')
                            .setEmoji('🔓')
                            .setStyle('SUCCESS'),
                        new Discord.MessageButton()
                            .setCustomId('delete-ticket')
                            .setLabel('Διαγραφή εισιτηρίου')
                            .setEmoji('🗑️')
                            .setStyle('DANGER')
                    );

                    await interaction.editReply({
                        content: 'Το εισιτήριο έκλεισε.',
                        components: [reopenRow],
                    });
                } else if (i.customId === 'no') {
                    await interaction.editReply({
                        content: 'Το κλείσιμο του εισιτηρίου ακυρώθηκε.',
                        components: [],
                    });
                }
            });

            collector.on('end', (_, reason) => {
                if (reason !== 'time') return;
                interaction.editReply({
                    content: 'Η ενέργεια κλεισίματος έληξε.',
                    components: [],
                });
            });
        }

        if (interaction.isButton() && interaction.customId === 'reopen-ticket') {
            const chan = interaction.channel;

            try {
                if (!chan.name.startsWith('closed-')) {
                    return interaction.reply({ content: 'Αυτό το εισιτήριο δεν είναι κλειστό.', ephemeral: true });
                }

                if (!chan.manageable) {
                    return interaction.reply({ content: 'Δεν έχω τα απαραίτητα δικαιώματα.', ephemeral: true });
                }

                const originalCategory = chan.topic?.split('|')[1] || client.config.ticket.categories.defaultCategory;

                await chan.edit({
                    name: chan.name.replace('closed-', ''),
                    parent: originalCategory,
                    permissionOverwrites: [
                        {
                            id: chan.topic?.split('|')[0],
                            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                        },
                        {
                            id: client.config.server.roles.staff,
                            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                        },
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                    ],
                });

                const newButtons = new Discord.MessageActionRow().addComponents(
                    new Discord.MessageButton()
                        .setCustomId('delete-ticket')
                        .setLabel('Διαγραφή εισιτηρίου')
                        .setEmoji('🗑️')
                        .setStyle('DANGER')
                );

                await chan.send({
                    content: 'Το εισιτήριο άνοιξε ξανά!',
                    components: [newButtons],
                });

                await interaction.reply({ content: 'Το εισιτήριο έχει ανοίξει ξανά.', ephemeral: true });

            } catch (error) {
                console.error('Error reopening ticket:', error);
                await interaction.reply({ content: 'Υπήρξε σφάλμα.', ephemeral: true });
            }
        }

        if (interaction.isButton() && interaction.customId === 'delete-ticket') {
            try {
                const chan = interaction.channel;

                if (!chan.deletable) {
                    return interaction.reply({ content: 'Δεν έχω τα απαραίτητα δικαιώματα για να διαγράψω αυτό το εισιτήριο.', ephemeral: true });
                }

                const transcript = await discordTranscripts.createTranscript(chan, {
                    limit: -1,
                    returnBuffer: false,
                    fileName: `transcript-${chan.name}.html`,
                    poweredBy: false,
                    saveImages: true
                });

                const embed = new Discord.MessageEmbed()
                    .setTitle('Καταγραφή Εισιτηρίου')
                    .setColor(client.config.server.color)
                    .addField('Όνομα Εισιτηρίου', chan.name, true)
                    .addField('Δημιουργός', `<@${chan.topic?.split('|')[0] || chan.topic}>`, true)
                    .addField('Claim από', chan.claimedBy ? chan.claimedBy : 'N/A', true)
                    .addField('Ώρα Δημιουργίας', `${moment(chan.createdAt).tz('Europe/Athens').format('LLLL')}`, true)
                    .addField('Ώρα Κλεισίματος', `${moment().tz('Europe/Athens').format('LLLL')}`, true)
                    .addField('Κλειστό από', `<@${interaction.user.id}>`, true)
                    .setDescription('Η πλήρης καταγραφή βρίσκεται στο συνημμένο αρχείο.');

                const transcriptChannel = client.channels.cache.get(client.config.ticket.transcriptChannel);
                if (transcriptChannel) {
                    await transcriptChannel.send({ embeds: [embed], files: [transcript] });
                }

                await interaction.reply({ content: 'Το εισιτήριο διαγράφεται...', ephemeral: false });

                setTimeout(async () => {
                    await chan.delete();
                }, 5000);

            } catch (error) {
                console.error('Error deleting ticket:', error);
                await interaction.reply({ content: 'Υπήρξε σφάλμα κατά τη διαγραφή του εισιτηρίου.', ephemeral: true });
            }
        }

    } catch (err) {
        console.error('Unhandled interaction error:', err);
    }
});
