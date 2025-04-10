const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getTopInviters } = require("../../utils/invitests");

const sendLeaderboard = async (client, context) => {
    const isInteraction = context.isCommand?.() || context.deferReply;
    if (isInteraction && !context.deferred && !context.replied) {
        await context.deferReply({ ephemeral: false });
    }

    const guild = context.guild;
    const topInviters = await getTopInviters(guild.id, 10);

    const embed = new MessageEmbed()
        .setTitle("Leaderboard")
        .setColor(client.config?.server?.color || "#2F3136")
        .setDescription(
            topInviters.map((entry, i) => {
                const member = guild.members.cache.get(entry.userId);
                const tag = member?.user.tag || `Unknown (${entry.userId})`;
                return `**${i + 1}** - ${tag} → **${entry.total}** invites`;
            }).join("\n") || "Δεν υπάρχουν invites ακόμα!"
        )
        .setFooter({ text: 'Made by m4r1os' })
        .setTimestamp();

    if (isInteraction) {
        await context.followUp({ embeds: [embed] });
    } else {
        await context.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
};

module.exports = {
    name: "leaderboard",
    description: "🏆 Εμφανίζει το leaderboard των προσκλήσεων slash command",
    aliases: ["invtop", "topinvites"],
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("🏆 Εμφανίζει το leaderboard των προσκλήσεων"),
    run: async (client, message) => await sendLeaderboard(client, message),
    execute: async (interaction) => await sendLeaderboard(interaction.client, interaction)
};
