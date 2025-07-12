const client = require("../index");
const Discord = require('discord.js');

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        if (addedRoles.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const entry = await newMember.guild.fetchAuditLogs({ 
                type: 'MEMBER_ROLE_UPDATE',
                limit: 1
            }).then(audit => audit.entries.first());

            const logUser = entry?.executor;
            
            const embed = new Discord.MessageEmbed()
                .setColor("00ff00")
                .setAuthor({ 
                    name: newMember.user.tag, 
                    iconURL: newMember.user.displayAvatarURL(), 
                    url: `https://discord.com/users/${newMember.user.id}`
                })
                .setDescription(`\`\`\`Role(s) added to user\`\`\`\n**User:** <@${newMember.user.id}>\n**Added Roles:** ${addedRoles.map(r => r.toString()).join(', ')}\n**By:** ${logUser ? `<@${logUser.id}>` : 'Unknown'}`);

            const logChannel = newMember.guild.channels.cache.get(client.config.logs.role);
            if (logChannel) await logChannel.send({ embeds: [embed] });
        }

        if (removedRoles.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const entry = await newMember.guild.fetchAuditLogs({ 
                type: 'MEMBER_ROLE_UPDATE',
                limit: 1
            }).then(audit => audit.entries.first());

            const logUser = entry?.executor;
            
            const embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setAuthor({ 
                    name: newMember.user.tag, 
                    iconURL: newMember.user.displayAvatarURL(), 
                    url: `https://discord.com/users/${newMember.user.id}`
                })
                .setDescription(`\`\`\`Role(s) removed from user\`\`\`\n**User:** <@${newMember.user.id}>\n**Removed Roles:** ${removedRoles.map(r => r.toString()).join(', ')}\n**By:** ${logUser ? `<@${logUser.id}>` : 'Unknown'}`);

            const logChannel = newMember.guild.channels.cache.get(client.config.logs.role);
            if (logChannel) await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error in guildMemberUpdate event:', error);
    }
});
