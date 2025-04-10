const client = require("../index");
const Discord = require('discord.js');
const moment = require("moment");

let temporary = [];

client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = client.guilds.cache.get(client.config.server.id);
    const user = await client.users.fetch(newState.id);
    let voiceCH = client.channels.cache.get(client.config.automove.support.channel);
    let category = voiceCH.parent;
    let wfschannel = client.channels.cache.get(client.config.automove.support.notification);

    if (newState.channelId === voiceCH.id) {
        try {
            const supportChannel = await newState.guild.channels.create(`📞Support ${user.tag}`, {
                permissionOverwrites: [
                    {
                        id: newState.id,
                        allow: ["VIEW_CHANNEL"]
                    },
                    {
                        id: newState.guild.id,
                        deny: ["VIEW_CHANNEL"]
                    },
                    {
                        id: client.config.server.roles.staff,
                        allow: ["VIEW_CHANNEL"]
                    }
                ],
                type: 'GUILD_VOICE',
                parent: category,
                userLimit: 10
            });

            temporary.push({ newID: supportChannel.id, guild: supportChannel.guild });
            await newState.setChannel(supportChannel.id);

            const roles = newState.member.roles.cache.filter(role => role.id !== guild.id);
            const rolesList = roles.sort((a, b) => b.position - a.position).map(role => role.toString()).join(', ');
            const size = roles.size;

            const embed = new Discord.MessageEmbed()
                .setAuthor({ name: `${user.tag} | ${user.id}`, iconURL: user.avatarURL(), url: `https://discord.com/users/${user.id}` })
                .setDescription(`\`\`\`Ο ${user.tag} χρειάζεται τη βοήθειά σας περιμένοντας στο 📞Support ${user.tag}\`\`\``)
                .addFields(
                    { name: `Ρόλοι: (${size})`, value: size > 0 ? rolesList : 'Κανένας ρόλος', inline: true },
                    { name: 'Συνδέθηκε στον διακομιστή:', value: moment(user.joinedAt).format('l'), inline: true },
                    { name: 'Συνδέθηκε στο discord:', value: new Date(user.createdTimestamp).toLocaleDateString(), inline: true }
                )
                .setColor(client.config.server.color)
                .setFooter({ text: 'Made by m4r1os' });

            wfschannel.send({ content: `<@&${client.config.server.roles.staff}>`, embeds: [embed] });
        } catch (error) {
            console.error('Error creating support channel:', error);
        }
    }

    if (temporary.length > 0) {
        for (let i = temporary.length - 1; i >= 0; i--) {
            const ch = client.channels.cache.get(temporary[i].newID);
            if (ch && ch.members.size === 0) {
                try {
                    await ch.delete();
                    temporary.splice(i, 1);
                } catch (err) {
                    if (err.code === 10003) { 
                        console.warn(`Channel ${temporary[i].newID} already deleted.`);
                        temporary.splice(i, 1);
                    } else {
                        console.error('API error while deleting a support channel:', err);
                    }
                }
            }
        }
    }
});
