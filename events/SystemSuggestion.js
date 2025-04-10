const client = require("../index");

client.on('messageCreate', async message => {
    if(message.channel.type === "dm") return console.log(message.content + "\n" + message.author.username)
    if(!message.guild) return;
  if(message.channel.id === client.config.suggestion){
    message.react(client.config.server.emojis['sin ena'])
    message.react(client.config.server.emojis['plein ena'])
  }
  });