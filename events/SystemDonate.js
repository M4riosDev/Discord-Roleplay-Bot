const client = require("../index");
const Discord = require('discord.js');
const moment = require("moment")

var temporary = [];
client.on('voiceStateUpdate', async (oldMember, newMember) => {
    const guild = client.guilds.cache.get(client.config.server.id);

    const user = await client.users.fetch(newMember.id)
    let voiceCH = client.channels.cache.get(client.config.automove.donate.channel);
    let category = voiceCH.parent
    let wfschannel = client.channels.cache.get(client.config.automove.donate.notification);
    if (newMember.channel == voiceCH) {
        await newMember.guild.channels.create(`💸Donate ${user.tag}`, {
          permissionOverwrites: [
            {
                id: newMember.id,
                allow: ["VIEW_CHANNEL"]
            },
            {
                id: newMember.guild.id,
                deny: ["VIEW_CHANNEL"]
            },
            {
                id: client.config.server.roles.dmanager,
                allow: ["VIEW_CHANNEL"]
            }
        ],
            type: 'GUILD_VOICE', parent: category, userLimit: 10
        }).then(async (channel, error) => {
            temporary.push({ newID: channel.id, guild: channel.guild });
            await newMember.setChannel(channel.id).catch()
            const roleslist = ((newMember.member.roles.cache.filter((roles) => roles.id !== guild.id).sort((a,b) => b.position - a.position))).map((role) => role.toString()).join()
            const size = newMember.member.roles.cache.size - 1
   

            if(size > 0){

                const embed = new Discord.MessageEmbed()
                .setAuthor({ name: `${user.tag} | ${user.id}`, iconURL: user.avatarURL(), url: `https://discord.com/users/${user.id}` })
                .setDescription(`\`\`\`Ο ${user.tag} χρειάζεται τη βοήθειά σας περιμένοντας στο 💸Donate ${user.tag}\`\`\``)
                .addFields(
                    { name:`Ρόλοι: (${size})`, value: `${roleslist}`, inline: true },
                    { name: 'Συνδέθηκε στον διακομιστή:', value: `${moment(user.joinedAt).format('l')}`, inline: true },
                    { name: 'Συνδέθηκε στο discord:', value: `${new Date(user.createdTimestamp).toLocaleDateString()}`, inline: true },
                )
    
                .setColor(client.config.server.color)
                .setFooter({ text: 'Made by m4r1os' });
                wfschannel.send({content: `<@&${client.config.server.roles.dmanager}>`, embeds: [embed]})

            }else{
                const embed = new Discord.MessageEmbed()
                .setAuthor({ name: `${user.tag} | ${user.id}`, iconURL: user.avatarURL(), url: `https://discord.com/users/${user.id}` })
                .setDescription(`\`\`\`Ο ${user.tag} χρειάζεται τη βοήθειά σας περιμένοντας στο 💸Donate ${user.tag}\`\`\``)
                .addFields(
                    { name:`Ρόλοι: (${size})`, value: `Κανένας ρόλος`, inline: true },
                    { name: 'Συνδέθηκε στον διακομιστή:', value: `${moment(user.joinedAt).format('l')}`, inline: true },
                    { name: 'Συνδέθηκε στο discord:', value: `${new Date(user.createdTimestamp).toLocaleDateString()}`, inline: true },
                )
                .setColor(client.config.server.color)
                .setFooter({ text: newMember.guild.name, iconURL: newMember.guild.iconURL() });
                wfschannel.send({content: `<@&${client.config.server.roles.dmanager}>`, embeds: [embed]})
            }


        });
    }
    if (temporary.length > 0) for (let i = 0; i < temporary.length; i++) {
        let ch = client.channels.cache.get(temporary[i].newID);
        if (ch.members.size === 0) {
            await ch.delete().catch(err => console.log('Api error while deleting a support channel.'));
            return temporary.splice(i, 1);
        }
    }
});