const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("guildMemberUpdate", (oldMember, newMember) => {
    const channel = newMember.guild.channels.cache.get(client.config.logs.moderation);
    if (!channel) return;

    if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: newMember.user.username, iconURL: newMember.user.displayAvatarURL(), url: "https://discord.com/users/" + newMember.user.id })
            .setDescription(` \`\`\` Mute \`\`\` \n**User:** <@!${newMember.user.id}>\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
            .setFooter({ text: 'Made by m4r1os' })
            .setColor(client.config.server.color);
        channel.send({ embeds: [embed] });
    }

    if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: newMember.user.username, iconURL: newMember.user.displayAvatarURL(), url: "https://discord.com/users/" + newMember.user.id })
            .setDescription(` \`\`\` Unmute \`\`\` \n**User:** <@!${newMember.user.id}>\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
            .setFooter({ text: 'Made by m4r1os' })
            .setColor(client.config.server.color);
        channel.send({ embeds: [embed] });
    }
});