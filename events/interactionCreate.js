const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const client = require("../index");
const db = require('../models/giveaways');

client.on("interactionCreate", async (interaction) => {
    // Slash Command Handling
    if (interaction.isCommand()) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd) return interaction.followUp({ content: "An error has occurred." });

        const args = [];

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }

        interaction.member = interaction.guild.members.cache.get(interaction.user.id);
        cmd.run(client, interaction, args);
    }

    // Context Menu Handling
    if (interaction.isContextMenu()) {
        await interaction.deferReply({ ephemeral: true });
        const command = client.slashCommands.get(interaction.commandName);
        if (command) command.run(client, interaction);
    }

    // Button Interaction Handling
    if (interaction.isButton()) {

        // 🎉 Giveaway Entry Button
        if (interaction.customId === "enter_giveaway") {
            try {
                const row = await db.findOne({ message_id: interaction.message.id });
                if (!row) {
                    return interaction.reply({ content: "Αυτό το giveaway δεν υπάρχει!", ephemeral: true });
                }

                let participants = row.participants || [];

                if (participants.includes(interaction.user.id)) {
                    return interaction.reply({ content: "Έχεις ήδη συμμετάσχει!", ephemeral: true });
                }

                participants.push(interaction.user.id);

                await db.updateOne(
                    { _id: row._id },
                    { $set: { participants: participants } }
                );

                const newRow = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId("enter_giveaway")
                        .setLabel(`Enter Giveaway (${participants.length})`)
                        .setStyle("PRIMARY")
                );

                await interaction.update({ components: [newRow] });

            } catch (err) {
                console.error(err);
                interaction.reply({ content: "Κάτι πήγε στραβά.", ephemeral: true });
            }
            return;
        }

        // 🎫 Ticket Buttons
        const { guild, channel, customId } = interaction;
        const staffRoleId = client.config.ticket.staffRoleId;
        const closedCategoryId = client.config.ticket.closedCategory;
        const topic = channel.topic || '';
        const [creatorId, originalCategoryId] = topic.split('|');

        const messages = await channel.messages.fetch({ limit: 10 });
        const originalMessage = messages.find(
            (msg) => msg.author.id === client.user.id && msg.embeds.length > 0
        );
        if (!originalMessage) return;

        const embed = new MessageEmbed(originalMessage.embeds[0]);
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }

        // 🔒 Κλείσιμο ή 🔓 Επανα-άνοιγμα
        if (customId === 'close-or-reopen-ticket') {
            try {
                if (channel.name.startsWith('closed-')) {
                    // Reopen
                    await channel.setParent(originalCategoryId || null, { lockPermissions: false });
                    await channel.edit({
                        name: channel.name.replace('closed-', ''),
                        topic: `${creatorId}|${originalCategoryId}`,
                        permissionOverwrites: [
                            { id: creatorId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: staffRoleId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: guild.roles.everyone.id, deny: ['VIEW_CHANNEL'] },
                        ],
                    });

                    embed.addField('🔓 Επανα-άνοιγμα', `Από <@${interaction.user.id}>`, false);

                    const actionRow = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId('close-or-reopen-ticket')
                            .setLabel('Κλείσιμο εισιτηρίου')
                            .setEmoji('🔒')
                            .setStyle('DANGER'),
                        new MessageButton()
                            .setCustomId('claim-ticket')
                            .setLabel('Claim Ticket')
                            .setEmoji('🛠️')
                            .setStyle('PRIMARY')
                    );

                    await originalMessage.edit({ embeds: [embed], components: [actionRow] });

                } else {
                    // Close
                    await channel.setParent(closedCategoryId, { lockPermissions: false });

                    await channel.edit({
                        name: `closed-${channel.name}`,
                        topic: `${creatorId}|${originalCategoryId}`,
                        permissionOverwrites: [
                            { id: creatorId, deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: staffRoleId, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] },
                            { id: guild.roles.everyone.id, deny: ['VIEW_CHANNEL'] },
                        ],
                    });

                    embed.addField('🔒 Κλείσιμο Εισιτηρίου', `Από <@${interaction.user.id}>`, false);

                    const actionRow = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId('close-or-reopen-ticket')
                            .setLabel('Άνοιγμα ξανά')
                            .setEmoji('🔓')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('delete-ticket')
                            .setLabel('Διαγραφή εισιτηρίου')
                            .setEmoji('🗑️')
                            .setStyle('DANGER')
                    );

                    await originalMessage.edit({ embeds: [embed], components: [actionRow] });
                }
            } catch (error) {
                console.error('❌ Σφάλμα στο close-or-reopen-ticket:', error);
                await interaction.followUp({ content: '❌ Παρουσιάστηκε σφάλμα.', ephemeral: true });
            }
        }

        if (customId === 'claim-ticket') {
            try {
                embed.addField('🛠️ Ανάληψη', `Από <@${interaction.user.id}>`, false);
                await originalMessage.edit({ embeds: [embed] });
                await channel.send(`🛠️ Το εισιτήριο αναλήφθηκε από <@${interaction.user.id}>.`);
            } catch (err) {
                console.error('❌ Σφάλμα στο claim-ticket:', err);
            }
        }

        if (customId === 'delete-ticket') {
            try {
                await channel.send('🗑️ Το εισιτήριο θα διαγραφεί σε 5 δευτερόλεπτα...');
                setTimeout(() => {
                    channel.delete().catch(() => {});
                }, 5000);
            } catch (err) {
                console.error('❌ Σφάλμα στο delete-ticket:', err);
            }
        }
    }
});
