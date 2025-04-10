const client = require("../index");
const Discord = require('discord.js');
const moment = require('moment');
const channelCache = new Map();

client.on("channelCreate", async (channel) => {
    const logChannel = channel.guild.channels.cache.get(client.config.logs.channel);
    if (logChannel) {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            type: 'CHANNEL_CREATE',
            limit: 1
        });

        const creationLog = fetchedLogs.entries.first();
        const creator = creationLog ? creationLog.executor : null; 

        channelCache.set(channel.id, { 
            name: channel.name, 
            creator: creator ? creator.tag : "Unknown", 
            time: moment().format("MMM Do YYYY, h:mm:ss a") 
        });

        const embed = new Discord.MessageEmbed()
            .setTitle("Channel Created")
            .setDescription(`**Channel created:** ${channel} ${channel.name || "unknown"}\n**Created by:** ${creator ? creator.tag : "Unknown"}\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
            .setFooter({ text: 'Made by m4r1os' })
            .setColor("GREEN");

        logChannel.send({ embeds: [embed] });
    }
});

client.on("channelDelete", async (channel) => {
    const logChannel = channel.guild.channels.cache.get(client.config.logs.channel);
    if (logChannel) {
        const cachedChannel = channelCache.get(channel.id);
        const channelName = channel.name || cachedChannel?.name || "unknown";
        const creatorName = cachedChannel?.creator || "Unknown";

        const fetchedLogs = await channel.guild.fetchAuditLogs({
            type: 'CHANNEL_DELETE',
            limit: 1
        });

        const deletionLog = fetchedLogs.entries.first();
        const executor = deletionLog ? deletionLog.executor : null; 

        const embed = new Discord.MessageEmbed()
            .setTitle("Channel Deleted")
             .setDescription(`**Channel:** ${channelName}\n**Deleted by:** ${executor ? executor.tag : "Unknown"}\n**Time:** \`${moment().format("MMM Do YYYY, h:mm:ss a")}\``)
             .setFooter({ text: 'Made by m4r1os' })
            .setColor("RED");

        logChannel.send({ embeds: [embed] });
        channelCache.delete(channel.id);
    }
});
