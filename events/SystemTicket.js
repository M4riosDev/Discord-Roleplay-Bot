const Discord = require('discord.js');
const fs = require('fs');
const moment = require('moment-timezone');
const discordTranscripts = require('discord-html-transcripts');
const client = require('../index');

client.on('interactionCreate', async (interaction) => {
    try {
        const chan = interaction.channel;

        async function clearOldButtons(channel) {
            const messages = await channel.messages.fetch({ limit: 10 });
            for (const msg of messages.values()) {
                if (msg.components.length > 0) {
                    try {
                        await msg.edit({ components: [] });
                    } catch (e) {
                        console.warn('Could not clear components from a message:', e);
                    }
                }
            }
        }

        if (interaction.isSelectMenu() && interaction.customId === 'ticket_menu') {
            const selectedValue = interaction.values[0];
            const maxTickets = 1;

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
                        .setCustomId('close-or-reopen-ticket')
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

        if (interaction.isButton()) {
            const chan = interaction.channel;
            const creatorId = chan.topic?.split('|')[0];
            const originalCategory = chan.topic?.split('|')[1] || client.config.ticket.categories.defaultCategory;
            const staffRoleId = client.config.server.roles.staff;

            const fetched = await chan.messages.fetch({ limit: 10 });
            const originalMessage = fetched.find(m => m.embeds.length > 0 && m.author?.bot);

            if (!originalMessage) {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ content: 'Δεν βρέθηκε το αρχικό μήνυμα.', ephemeral: true });
                }
                return;
            }

            const embed = originalMessage.embeds[0];
            const updatedEmbed = new Discord.MessageEmbed(embed).setTimestamp();

            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            if (interaction.customId === 'close-or-reopen-ticket') {
                if (chan.name.startsWith('closed-')) {
                    await chan.edit({
                        name: chan.name.replace('closed-', ''),
                        parent: originalCategory,
                        topic: `${creatorId}|${originalCategory}`,
                        permissionOverwrites: [
                            { id: creatorId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: staffRoleId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: interaction.guild.roles.everyone.id, deny: ['VIEW_CHANNEL'] }
                        ],
                    });

                    updatedEmbed.addField('🔓 Επανα-άνοιγμα', `Από <@${interaction.user.id}>`, false);

                    const reopenedRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId('close-or-reopen-ticket')
                            .setLabel('Κλείσιμο εισιτηρίου')
                            .setEmoji('🔒')
                            .setStyle('DANGER'),
                        new Discord.MessageButton()
                            .setCustomId('claim-ticket')
                            .setLabel('Claim Ticket')
                            .setEmoji('🛠️')
                            .setStyle('PRIMARY')
                    );

                    await originalMessage.edit({ embeds: [updatedEmbed], components: [reopenedRow] });

                } else {
                    await chan.setParent(client.config.ticket.closedCategory, { lockPermissions: false });
                    await chan.edit({
                        name: `closed-${chan.name}`,
                        permissionOverwrites: [
                            { id: creatorId, deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: staffRoleId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: interaction.guild.roles.everyone.id, deny: ['VIEW_CHANNEL'] }
                        ],
                    });

                    updatedEmbed.addField('🔒 Κλείσιμο Εισιτηρίου', `Από <@${interaction.user.id}>`, false);

                    const closedRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId('close-or-reopen-ticket')
                            .setLabel('Άνοιγμα ξανά')
                            .setEmoji('🔓')
                            .setStyle('SUCCESS'),
                        new Discord.MessageButton()
                            .setCustomId('delete-ticket')
                            .setLabel('Διαγραφή εισιτηρίου')
                            .setEmoji('🗑️')
                            .setStyle('DANGER')
                    );

                    await originalMessage.edit({ embeds: [updatedEmbed], components: [closedRow] });
                }
            }

            if (interaction.customId === 'delete-ticket') {
                try {
                    if (!chan.deletable) {
                        await interaction.followUp({ content: 'Δεν έχω δικαίωμα να διαγράψω αυτό το εισιτήριο.', ephemeral: true });
                        return;
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
                        .addField('Δημιουργός', `<@${creatorId}>`, true)
                        .addField('Claim από', chan.claimedBy ? chan.claimedBy : 'N/A', true)
                        .addField('Ώρα Δημιουργίας', `${moment(chan.createdAt).tz('Europe/Athens').format('LLLL')}`, true)
                        .addField('Ώρα Κλεισίματος', `${moment().tz('Europe/Athens').format('LLLL')}`, true)
                        .addField('Κλειστό από', `<@${interaction.user.id}>`, true)
                        .setDescription('Η πλήρης καταγραφή βρίσκεται στο συνημμένο αρχείο.');

                    const transcriptChannel = client.channels.cache.get(client.config.ticket.transcriptChannel);
                    if (transcriptChannel) {
                        await transcriptChannel.send({ embeds: [embed], files: [transcript] });
                    }

                    await interaction.followUp({ content: 'Το εισιτήριο διαγράφεται...', ephemeral: false });
                    setTimeout(() => chan.delete().catch(() => {}), 5000);

                } catch (error) {
                    console.error('Error deleting ticket:', error);
                    await interaction.followUp({ content: 'Σφάλμα κατά τη διαγραφή του εισιτηρίου.', ephemeral: true });
                }
            }
        }
    } catch (err) {
        console.error('Σφάλμα:', err);
    }
});
