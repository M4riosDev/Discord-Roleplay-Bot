const client = require("../index");
const Discord = require('discord.js');

client.on("messageUpdate", async (oldMessage, newMessage) => {
  try{
if(newMessage.author.bot) return
let channel = oldMessage.guild.channels.cache.get(client.config.logs.message)
const url = oldMessage.url
const embed = new Discord.MessageEmbed()
.setTitle(`Edited Message Logs`)
.setColor('#993366')
.setTimestamp()
.setFooter({ text: 'Made by m4r1os' })
.setURL(url)
.addField(`Παλιό μήνυμα`, `*${oldMessage.content}*`, false)
.addField(`Τελικό μήνυμα`, `*${newMessage.content}*`, false)
.addField(`Το μήνυμα είναι του`, `**<@${oldMessage.author.id}>**`, true)
.addField(`Κανάλι που ήταν το μήνυμα`, `**<#${oldMessage.channel.id}>**`, true)
channel.send({embeds: [embed]});
  }catch{
      
  }
})