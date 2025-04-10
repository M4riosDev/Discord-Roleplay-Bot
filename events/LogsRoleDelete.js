const client = require("../index");
const Discord = require('discord.js');

client.on("roleDelete", async (role) => {

    const fetchedLogs = await role.guild.fetchAuditLogs({
          limit: 1,
          type: 'ROLE_DELETE',
      });
  
    const fasdfa = await fetchedLogs.entries.first();
      let { executor, target} = fasdfa;
    if(executor === null) executor = "\u200B";
    if(target === null || target === undefined) target = "\u200B";
  
      const embed = new Discord.MessageEmbed()
        .setColor(client.config.server.color)
        .setAuthor(`A role was deleted`)
        .addFields(
          {name: "User", value: executor.username},
          {name: "Role Name", value: role.name},
          {name: "Role ID", value: role.id},
        )
        .setFooter({ text: 'Made by m4r1os' })
        .setTimestamp();
        client.channels.cache.get(client.config.logs.role).send({embeds: [embed]});
  
  });