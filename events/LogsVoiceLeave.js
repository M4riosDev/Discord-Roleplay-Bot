const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.channel && !newState.channel) {
        const member = oldState.member;
        const logChannel = oldState.guild.channels.cache.get(client.config.logs.voice);
        if (!logChannel) return;

        let kickedBy;

        try {
            const fetchedLogs = await oldState.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_DISCONNECT',
            });

            const kickLog = fetchedLogs.entries.first();
            if (kickLog) {
                const { executor, target, createdTimestamp } = kickLog;
                const timeDiff = Date.now() - createdTimestamp;
                if (target && target.id === member.id && timeDiff < 5000) {
                    kickedBy = executor;
                }
            }
        } catch (err) {
            console.error("Failed to fetch voice kick audit logs:", err);
        }

        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL(), url: "https://discord.com/users/" + member.user.id })
            .setDescription(
                `\`\`\` Voice Leave \`\`\`\n` +
                `**Channel:** ${oldState.channel.name}\n` +
                `**Mention:** <@${member.user.id}>\n` +
                (kickedBy ? `**Kicked by:** <@${kickedBy.id}>\n` : "") +
                `**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``
            )
            .setFooter({ text: 'Made by m4r1os' })
            .setColor(client.config.server.color);

        logChannel.send({ embeds: [embed] });
    }
});
