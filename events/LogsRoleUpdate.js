const client = require("../index");
const Discord = require('discord.js');

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (newMember.roles.cache.size > oldMember.roles.cache.size) {
        let entry = await oldMember.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE '}).then(audit => audit.entries.first());
        let logUser = entry.executor.id;
        let fad = oldMember.guild.members.cache.get(entry.executor.id) || newMember.guild.members.cache.get(entry.executor.id);
  
  
        const roleRemovedEmbed = new Discord.MessageEmbed()
            .setColor("00ff00")
            .setAuthor({ name: oldMember.user.tag, iconURL: oldMember.user.displayAvatarURL(), url: `https://discord.com/users/${oldMember.user.id}`})
            .setFooter({ text: 'Made by m4r1os' })
        
            newMember.roles.cache.forEach(role => {
            if (!oldMember.roles.cache.has(role.id)) {
              roleRemovedEmbed.setDescription(`\`\`\` A user Role Was added\`\`\` \n **Mention:** <@!${oldMember.user.id}>
              **Ρόλος:** ${role}
              **Από τον/ην:** <@!${logUser}>`)
  
            }
        });
  
        const discordlogs = newMember.guild.channels.cache.get(client.config.logs.role);
        discordlogs.send({embeds: [roleRemovedEmbed]})
      }
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
        let entry = await newMember.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE '}).then(audit => audit.entries.first());
        let logUser = entry.executor.id;
        let fad = oldMember.guild.members.cache.get(entry.executor.id) || newMember.guild.members.cache.get(entry.executor.id);
  
  
        const roleRemovedEmbed = new Discord.MessageEmbed()
            .setColor("RED")
            .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL(), url: `https://discord.com/users/${newMember.user.id}`})
        
        oldMember.roles.cache.forEach(role => {
  
  
            if (!newMember.roles.cache.has(role.id)) {
  
              roleRemovedEmbed.setDescription(`\`\`\` A user role was removed\`\`\` \n **Mention:** <@!${oldMember.user.id}>
              **Ρόλος:** ${role}
              **Από τον/ην:** <@!${logUser}>`)
  
            }
        });
  
  
        const discordlogs = newMember.guild.channels.cache.get(client.config.logs.role);
        discordlogs.send({embeds: [roleRemovedEmbed]})
    }
  });