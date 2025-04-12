const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');

client.on("voiceStateUpdate", (oldState, newState) => {
    if (oldState.channel && !newState.channel) {
        const member = oldState.member;
        const channel = oldState.guild.channels.cache.get(client.config.logs.voice);

        if (channel) {
            const embed = new Discord.MessageEmbed()
                .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL(), url: "https://discord.com/users/" + member.user.id })
                .setDescription(` \`\`\` Voice Leave \`\`\` \n**Channel:** ${oldState.channel.name}\n**Mention:** <@!${member.user.id}>\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
                .setColor(client.config.server.color)
            channel.send({ embeds: [embed] });
        }
    }
});
