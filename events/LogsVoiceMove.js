const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("voiceStateUpdate", (oldState, newState) => {
    if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
        const member = newState.member;
        const channel = newState.guild.channels.cache.get(client.config.logs.voice);

        if (channel) {
            const embed = new Discord.MessageEmbed()
                .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL(), url: "https://discord.com/users/" + member.user.id })
                .setDescription(` \`\`\` Voice Move \`\`\` \n**From:** ${oldState.channel.name}\n**To:** ${newState.channel.name}\n**Mention:** <@!${member.user.id}>\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
                .setColor("89cff0")
            channel.send({ embeds: [embed] });
        }
    }
});
