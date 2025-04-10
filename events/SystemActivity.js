const client = require("../index");
const Discord = require('discord.js');
const prettyMs = require('pretty-ms');
const moment = require('moment-timezone');
const Activity = require('../models/activity');

function parseTimeInput(input) {
    const timeRegex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i;
    const match = input.match(timeRegex);
    if (!match) return null;
    const [, h, m, s] = match.map(Number);
    const totalMs = (h || 0) * 3600000 + (m || 0) * 60000 + (s || 0) * 1000;
    return totalMs > 0 ? totalMs : null;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    const values = interaction.values[0];
    const duty = client.channels.cache.get(client.config.duty.logs);
    const roleId = client.config.duty.onduty;
    const allowedRolesForHoursModification = client.config.duty.modifyduty;

    if (values === 'start') {
        await interaction.deferReply({ ephemeral: true });
        const startTime = Date.now();
        const datetime = moment().tz('Europe/Athens').format('DD/MM/YYYY HH:mm:ss');

        await Activity.updateOne(
            { userId: interaction.user.id },
            { $set: { startTime }, $setOnInsert: { totalTime: 0 } },
            { upsert: true }
        );

        await interaction.member.roles.add(roleId);

        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }), url: `https://discord.com/users/${interaction.user.id}` })
            .setTitle('ΕΝΑΡΞΗ ΥΠΗΡΕΣΙΑΣ')
            .setDescription(`**Η υπηρεσία ξεκίνησε:** ${datetime}`)
            .setTimestamp()
            .setFooter({ text: 'Made by m4r1os' })
            .setColor('GREEN');

        duty.send({ embeds: [embed] });
        await interaction.editReply({ content: `**Ξεκινήσατε την υπηρεσία σας με επιτυχία.**` });
    }

    if (values === 'stop') {
        await interaction.deferReply({ ephemeral: true });
        const user = await Activity.findOne({ userId: interaction.user.id });
        if (!user || !user.startTime) return interaction.editReply({ content: "**Η υπηρεσία σας έχει ήδη τερματιστεί.**" });

        const elapsedTime = Date.now() - user.startTime;
        user.totalTime += elapsedTime;
        user.startTime = null;
        await user.save();

        const datetime = moment().tz('Europe/Athens').format('DD/MM/YYYY HH:mm:ss');

        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }), url: `https://discord.com/users/${interaction.user.id}` })
            .setTitle('ΤΕΛΟΣ ΥΠΗΡΕΣΙΑΣ')
            .setDescription(`\`Η υπηρεσία τελείωσε: ${datetime}\`\n**Η υπηρεσία διάρκεσε: ${prettyMs(elapsedTime)}**\n**Συνολικός χρόνος υπηρεσίας: ${prettyMs(user.totalTime)}**`)
            .setTimestamp()
            .setColor('RED');

        duty.send({ embeds: [embed] });
        await interaction.member.roles.remove(roleId);
        await interaction.editReply({ content: `**Σταματήσατε την υπηρεσία σας με επιτυχία.**` });
    }

    if (values === 'leaderboard') {
        await interaction.deferReply({ ephemeral: true });
        const users = await Activity.find().sort({ totalTime: -1 });
        const leaderboard = users.map((u, i) => `${i + 1}. <@${u.userId}> - ${prettyMs(u.totalTime)}`).join('\n') || 'No data available';

        const embed = new Discord.MessageEmbed()
            .setTitle('Leaderboard')
            .setDescription(leaderboard)
            .setTimestamp()
            .setColor('BLUE');

        interaction.editReply({ embeds: [embed] });
    }

    if (values === 'hours') {
        await interaction.deferReply({ ephemeral: true });
        const user = await Activity.findOne({ userId: interaction.user.id });
        const totalTime = user ? user.totalTime : 0;

        const embed = new Discord.MessageEmbed()
            .setTitle('Συνολικός Χρόνος Υπηρεσίας')
            .setDescription(`<@${interaction.user.id}> έχει συνολικά υπηρετήσει για ${prettyMs(totalTime)}.`)
            .setTimestamp()
            .setColor('BLUE');

        interaction.editReply({ embeds: [embed] });
    }

    if (values === 'clear-activity') {
        if (!allowedRolesForHoursModification.some(role => interaction.member.roles.cache.has(role))) {
            return interaction.reply({ content: `Δεν έχετε τα κατάλληλα δικαιώματα για αυτή την ενέργεια.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const confirmRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('confirm-clear')
                    .setLabel('✅ Επιβεβαίωση')
                    .setStyle('DANGER'),
                new Discord.MessageButton()
                    .setCustomId('cancel-clear')
                    .setLabel('❌ Ακύρωση')
                    .setStyle('SECONDARY')
            );

        await interaction.editReply({
            content: "⚠ **Είστε σίγουροι ότι θέλετε να διαγράψετε όλα τα δεδομένα δραστηριότητας;**\nΑυτή η ενέργεια **δεν μπορεί να αναιρεθεί**!",
            components: [confirmRow]
        });

        const filter = i => i.user.id === interaction.user.id;
        interaction.channel.awaitMessageComponent({ filter, time: 15000 })
            .then(async i => {
                if (i.customId === 'confirm-clear') {
                    await Activity.deleteMany({});
                    i.update({ content: "✅ **Όλα τα δεδομένα δραστηριότητας διαγράφηκαν επιτυχώς!**", components: [] });
                } else {
                    i.update({ content: "❌ **Η ενέργεια ακυρώθηκε.**", components: [] });
                }
            })
            .catch(() => interaction.editReply({ content: "⏳ **Δεν δόθηκε απάντηση, η ενέργεια ακυρώθηκε.**", components: [] }));
    }

    const { MessageEmbed } = require('discord.js');

    if (values === 'add-hours' || values === 'remove-hours') {
        if (!allowedRolesForHoursModification.some(role => interaction.member.roles.cache.has(role))) {
            return interaction.reply({ content: `Δεν έχετε τα κατάλληλα δικαιώματα για αυτή την ενέργεια.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        interaction.editReply({ content: "Παρακαλώ εισάγετε τον χρήστη (αναφορά ή ID):" }).then(() => {
            const filter = m => interaction.user.id === m.author.id;
            interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                .then(async collected => {
                    const targetUser = collected.first().mentions.users.first() || client.users.cache.get(collected.first().content);
                    if (!targetUser) {
                        return interaction.followUp({ content: "Ο χρήστης δεν βρέθηκε. Δοκιμάστε ξανά.", ephemeral: true });
                    }

                    interaction.followUp({ content: "Εισάγετε τον χρόνο (π.χ. `1h 36m 12s`, `29m`, `2h`):", ephemeral: true }).then(() => {
                        interaction.channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
                            .then(async collected => {
                                const timeInput = collected.first().content;
                                const timeToModify = parseTimeInput(timeInput);
                                if (!timeToModify) {
                                    return interaction.followUp({
                                        content: "Μη έγκυρη μορφή χρόνου. Χρησιμοποιήστε π.χ. `1h 36m 12s`, `29m`, `2h`.",
                                        ephemeral: true
                                    });
                                }

                                let userDoc = await Activity.findOne({ userId: targetUser.id });
                                if (!userDoc) userDoc = new Activity({ userId: targetUser.id, totalTime: 0 });

                                if (values === 'remove-hours' && timeToModify > userDoc.totalTime) {
                                    return interaction.followUp({
                                        content: "Ο χρήστης δεν έχει τόσες ώρες για να αφαιρεθούν.",
                                        ephemeral: true
                                    });
                                }

                                userDoc.totalTime = values === 'add-hours'
                                    ? userDoc.totalTime + timeToModify
                                    : userDoc.totalTime - timeToModify;

                                await userDoc.save();

                                interaction.followUp({
                                    content: `${values === 'add-hours' ? 'Προστέθηκαν' : 'Αφαιρέθηκαν'} επιτυχώς ${prettyMs(timeToModify)} στον χρήστη ${targetUser.username}.`,
                                    ephemeral: true
                                });

                                const duty = client.channels.cache.get(client.config.duty.logs);
                                if (duty) {
                                    const logEmbed = new MessageEmbed()
                                        .setColor(values === 'add-hours' ? "GREEN" : "RED")
                                        .setTitle("Activity Edit")
                                        .setDescription(`Ο **${interaction.user.username}** (${interaction.user.id}) \n **${values === 'add-hours' ? 'Πρόσθεσε' : 'ΑΦΑΙΡΕΣΕ'}**  **${prettyMs(timeToModify)}** \n Στον/Στην **${targetUser.username}** (${targetUser.id}).`)
                                        .setTimestamp();

                                    duty.send({ embeds: [logEmbed] });
                                }
                            })
                            .catch(() => {
                                interaction.followUp({ content: "Αργήσατε να απαντήσετε. Παρακαλώ προσπαθήστε ξανά.", ephemeral: true });
                            });
                    });
                })
                .catch(() => {
                    interaction.followUp({ content: "Αργήσατε να απαντήσετε. Παρακαλώ προσπαθήστε ξανά.", ephemeral: true });
                });
        });
    }

    if (values === 'force-stop') {
        if (!allowedRolesForHoursModification.some(role => interaction.member.roles.cache.has(role))) {
            return interaction.reply({ content: `Δεν έχετε τα κατάλληλα δικαιώματα για αυτή την ενέργεια.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const onDutyUsers = interaction.guild.members.cache.filter(member => member.roles.cache.has(roleId));

        if (onDutyUsers.size === 0) {
            return interaction.editReply({ content: "Δεν υπάρχουν χρήστες σε υπηρεσία αυτή τη στιγμή.", ephemeral: true });
        }

        const options = onDutyUsers.map(member => ({
            label: member.user.tag,
            value: member.id
        }));

        const selectMenu = new Discord.MessageSelectMenu()
            .setCustomId('force-stop-users')
            .setPlaceholder('Επιλέξτε τους χρήστες που θέλετε να σταματήσετε')
            .setMinValues(1)
            .setMaxValues(options.length)
            .addOptions(options);

        const row = new Discord.MessageActionRow().addComponents(selectMenu);

        await interaction.editReply({
            content: "Επιλέξτε τους χρήστες που θέλετε να σταματήσετε:",
            components: [row]
        });

        client.on('interactionCreate', async selectInteraction => {
            if (!selectInteraction.isSelectMenu() || selectInteraction.customId !== 'force-stop-users') return;

            const selectedUserIds = selectInteraction.values;
            const datetime = moment().tz('Europe/Athens').format('DD/MM/YYYY HH:mm:ss');

            for (const userId of selectedUserIds) {
                const targetUser = await client.users.fetch(userId);
                const userDoc = await Activity.findOne({ userId: targetUser.id }) || new Activity({ userId: targetUser.id, totalTime: 0 });

                const elapsedTime = userDoc.startTime ? Date.now() - userDoc.startTime : 0;
                userDoc.totalTime += elapsedTime;
                userDoc.startTime = null;
                await userDoc.save();

                const embed = new Discord.MessageEmbed()
                    .setAuthor({ name: targetUser.tag, iconURL: targetUser.avatarURL({ dynamic: true }), url: `https://discord.com/users/${targetUser.id}` })
                    .setTitle('FORCE STOP ΥΠΗΡΕΣΙΑΣ')
                    .setDescription(`Η υπηρεσία τελείωσε με επιβολή: ${datetime}\n**Η υπηρεσία διάρκεσε: ${prettyMs(elapsedTime)}**\n**Συνολικός χρόνος υπηρεσίας: ${prettyMs(userDoc.totalTime)}**\n**Force stopped by: ${interaction.user.tag}**`)
                    .setTimestamp()
                    .setColor('RED');

                duty.send({ embeds: [embed] });

                const member = interaction.guild.members.cache.get(targetUser.id);
                if (member) await member.roles.remove(roleId);
            }

            await selectInteraction.update({ content: `**Η υπηρεσία τερματίστηκε επιτυχώς για τους επιλεγμένους χρήστες.**`, components: [] });
        });
    }
});