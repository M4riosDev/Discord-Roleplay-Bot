const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("guildBanAdd", async (ban) => {
    const { user, guild } = ban;

    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: 'MEMBER_BAN_ADD',
            limit: 1
        });
        const banLog = auditLogs.entries.first();

        if (!banLog || banLog.target.id !== user.id) return;

        const { executor, reason } = banLog;

        const channel = guild.channels.cache.get(client.config.logs.moderation);
        if (channel) {
            const embed = new Discord.MessageEmbed()
                .setAuthor({
                    name: user.username,
                    iconURL: user.displayAvatarURL(),
                    url: `https://discord.com/users/${user.id}`
                })
                .setDescription(
                    `\`\`\` Ban \`\`\`\n` +
                    `**User:** <@!${user.id}>\n` +
                    `**Banned by:** <@!${executor.id}>\n` +
                    `**Reason:** \`${reason || "No reason provided"}\`\n` +
                    `**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``
                )
                .setFooter({ text: 'Made by m4r1os' })
                .setColor(client.config.server.color || "#FF0000");

            channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error("Error fetching ban audit log or sending embed:", error);
    }
});
