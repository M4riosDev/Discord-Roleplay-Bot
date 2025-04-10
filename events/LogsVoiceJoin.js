const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("voiceStateUpdate", (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    if (!newState.channel) return; 

    const member = newState.member;
    const channel = newState.guild.channels.cache.get(client.config.logs.voice);

    if (channel) {
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL(), url: "https://discord.com/users/" + member.user.id })
            .setDescription(` \`\`\` Voice Join \`\`\` \n**Channel:** ${newState.channel.name}\n**Mention:** <@!${member.user.id}>\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
            .setFooter({ text: 'Made by m4r1os' })
            .setColor("00ff00")

        channel.send({ embeds: [embed] });
    }
});