const Discord = module.require("discord.js");
const ms = require("ms");
module.exports = {
  name: "lock-channel",
  description: "Locks a Channel",
  category: "admin",
  usage: "lock-channel <...reason>\nlock-channel <...time>",
  P_user: ["MANAGE_CHANNELS"],
  P_bot: ["MANAGE_CHANNELS"],
  run: async (client, message, args) => {
    if(message.member.roles.cache.some(r => r.name === client.config.server.perms)){
    const [...reason] = args;
    const duration = reason[0] ? ms(reason[0]) : false;
    if (duration) reason.shift();
    const _reason = reason.join(" ") || "There is no definite reason";

    message.channel.permissionOverwrites.edit(message.guild.id, {
      SEND_MESSAGES: false
    });
    const embed = new Discord.MessageEmbed()
      .setTitle("Channel Updates")
      .setDescription(
        `🔒 ${message.channel} has been Locked\nReason: ${_reason}\n${
          duration ? `Time : ${ms(duration)}` : ""
        }
        `
      )
      .setFooter({ text: 'Made by m4r1os' })
      .setColor("RANDOM");
    await message.channel.send({ embeds: [embed] });
    message.delete();
    if (duration && !isNaN(duration)) {
      setTimeout(async () => {
        message.channel.permissionOverwrites.edit(message.guild.id, {
          SEND_MESSAGES: true
        });
        const embed = new Discord.MessageEmbed()
          .setTitle("Channel Updates")
          .setDescription(`🔒 ${message.channel} has been Unlocked`)
          .setFooter({ text: 'Made by m4r1os' })
          .setColor("RANDOM");
        await message.channel.send({ embeds: [embed] });
      }, Number(duration));
    }
  }else{        
    message.delete().catch(err => console.log(err))
}}
};
