const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getInviteStats } = require("../../utils/invitests");

const sendStats = async (client, context) => {
    const isInteraction = context.isCommand?.() || context.deferReply;

    const guild = context.guild;
    if (!guild) return context.reply?.({ content: "❌ Η εντολή αυτή λειτουργεί μόνο σε servers.", ephemeral: true });

    const targetUser = isInteraction
        ? context.options.getUser("user") ?? context.user
        : context.mentions?.users?.first() ?? context.author;

    if (!targetUser) {
        const embed = new MessageEmbed()
            .setColor("RED")
            .setDescription("⚠️ Δεν βρέθηκε χρήστης!");

        if (isInteraction) {
            if (!context.deferred) await context.deferReply({ ephemeral: true });
            return context.followUp({ embeds: [embed] });
        } else {
            return context.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }
    }

    const { real, fake, left, bonus } = await getInviteStats(guild.id, targetUser.id);

    const embed = new MessageEmbed()
        .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setColor(client.config?.server?.color || "#2F3136")
        .setDescription(`📊 **Στατιστικά προσκλήσεων:**\n\n✅ **Real:** ${real}\n❌ **Fake:** ${fake}\n🚪 **Leaves:** ${left}\n🎁 **Bonus:** ${bonus}`)
        .setFooter({ text: 'Made by m4r1os' });

    if (isInteraction) {
        if (!context.deferred) await context.deferReply({ ephemeral: true });
        await context.followUp({ embeds: [embed] });
    } else {
        await context.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
};

module.exports = {
    name: "invites",
    description: "📊 Δείχνει πόσες προσκλήσεις έχει κάνει ένας χρήστης",
    aliases: ["inv"],
    data: new SlashCommandBuilder()
        .setName("invites")
        .setDescription("📊 Δείχνει πόσες προσκλήσεις έχει κάνει ένας χρήστης")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Ο χρήστης που θέλεις να δεις")
                .setRequired(false)
        ),
    run: async (client, message) => await sendStats(client, message),
    execute: async (interaction) => await sendStats(interaction.client, interaction)
};
