const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
        const member = newState.member;
        const logChannel = newState.guild.channels.cache.get(client.config.logs.voice);
        if (!logChannel) return;

        let movedBy;

        try {
            const fetchedLogs = await newState.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_MOVE'
            });

            const moveLog = fetchedLogs.entries.first();
            if (moveLog) {
                const { executor, target, createdTimestamp } = moveLog;
                const timeDiff = Date.now() - createdTimestamp;
                if (target && target.id === member.id && timeDiff < 5000) {
                    movedBy = executor;
                }
            }
        } catch (err) {
            console.error("Failed to fetch voice move audit logs:", err);
        }

        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL(), url: `https://discord.com/users/${member.user.id}` })
            .setDescription(
                `\`\`\` Voice Move \`\`\`\n` +
                `**From:** ${oldState.channel.name}\n` +
                `**To:** ${newState.channel.name}\n` +
                `**Mention:** <@${member.user.id}>\n` +
                (movedBy ? `**Moved by:** <@${movedBy.id}>\n` : "") +
                `**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``
            )
            .setFooter({ text: 'Made by m4r1os' })
            .setColor(client.config.server.color || "89cff0");

        logChannel.send({ embeds: [embed] });
    }
});
