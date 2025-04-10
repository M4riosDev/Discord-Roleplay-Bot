const { MessageActionRow, MessageButton } = require('discord.js'); 
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

    // Button Interaction Handling (Giveaway)
    if (interaction.isButton()) {
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
        }
    }
});
