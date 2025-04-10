const Discord = require('discord.js');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
module.exports = {
  name: "kickmember",
  aliases: ["kick"],
  description: "Kick a member",
  
  
run: async (client, message, args) => {
  if(message.member.roles.cache.some(r => r.name === client.config.server.perms)){
        const target = message.mentions.users.first();
        if(!target) return message.reply({ content: "Who are trying to kick? the chat?" })
        if(target){
            const memberTarget = message.guild.members.cache.get(target.id);
            
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                .setCustomId("2")
                .setLabel("Έγκριση εκδίωξης")
                .setStyle("PRIMARY"),
                
                new MessageButton()
                .setCustomId("1")
                
                .setLabel("Ακύρωση εκδίωξης")
                .setStyle("DANGER"),
            )
            const row2 = new MessageActionRow()
            .addComponents(
                
              new MessageButton()
                .setCustomId("4")
                .setLabel("Έγκριση εκδίωξης")
              .setDisabled(true)
                .setStyle("PRIMARY"),
                new MessageButton()
                .setCustomId("3")
                
                .setLabel("Ακύρωση εκδίωξης")
                .setDisabled(true)
                .setStyle("DANGER")
            )
            const filter1 = i => i.customId === "2" && i.user.id;

            const collector = message.channel.createMessageComponentCollector({ filter1 });

            collector.on('collect', async i => {
              const ban = new MessageEmbed() 
              .setTitle("KICK HAMMER")
              .setDescription(`Ο χρήστης εκδιώχθηκε.`)
                if (i.customId === "2") {
                    i.update({ embeds: [ban], components: [row2] })
                    memberTarget.kick();
                }
            })
            const filter2 = b => b.customId === "1" && i.user.id;

            const collectorr = message.channel.createMessageComponentCollector({ filter2 });
            
            collectorr.on('collect', async b => {
                if (b.customId === "1") {
const cancel = new MessageEmbed() 
                  .setTitle("Kick Hammer")
.setDescription("Η εντολή ακυρώθηκε")
                    b.update({ embeds: [cancel], components: [row2] })
                }
            })
const member = new MessageEmbed() 
.setTitle("Kick Hammer")
.setDescription(`Είσαι σίγουρος ότι θέλεις να εκδιώξει τον/την ${memberTarget}?`)
          
            message.channel.send({ embeds: [member], components: [row] })
        }
      }else{        
        message.delete().catch(err => console.log(err))
    }}
              }