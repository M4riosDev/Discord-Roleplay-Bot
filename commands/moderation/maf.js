const { Client, MessageEmbed } = require('discord.js');
const fs = require('fs');
const configPath = './configs/mafiaConfig.json';

function loadConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { channelId: null, categories: {} }; 
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

let refreshInterval = null;

module.exports = {
    name: 'setmafia',
    description: 'Ορίζει το κανάλι για την ενημέρωση των μαφιών.',
    async run(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Δεν έχεις άδεια για αυτή την εντολή.');
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) return message.reply('Μη έγκυρο κανάλι!');

        const config = loadConfig();
        config.channelId = channel.id;
        saveConfig(config);

        message.reply(`Το κανάλι ${channel} ορίστηκε επιτυχώς!`);

        updateMafiaEmbed(client, config);


        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => updateMafiaEmbed(client, config), 60000);
    }
};

async function updateMafiaEmbed(client, config) {
    if (!config || !config.categories) {
        console.error("Το config δεν είναι σωστό ή είναι κενό!");
        return;
    }

    const channel = client.channels.cache.get(config.channelId);
    if (!channel) {
        console.error("Το κανάλι δεν βρέθηκε!");
        return;
    }


    const embed = new MessageEmbed()
        .setTitle('Criminal Jobs Members')
        .setFooter({ text: 'Made by m4r1os' })
        .setColor('#ff0000');

    for (const category of Object.keys(config.categories)) {
        const roles = config.categories[category];

        if (!Array.isArray(roles)) {
            console.error(`Η κατηγορία ${category} δεν περιέχει λίστα ρόλων.`);
            continue;
        }

   let roleDetails = roles.map(roleId => {
    let role = channel.guild.roles.cache.get(roleId);
    return role 
        ? `\`|${role.name} (${role.members.size})\`` 
        : `\`|❌ Άγνωστος Ρόλος (ID: ${roleId})\``;
}).join('\n');



        embed.addField(`${category}:`, roleDetails || 'Δεν έχουν οριστεί ρόλοι', false);
    }

    if (!channel.permissionsFor(client.user).has('SEND_MESSAGES')) {
        console.error("Ο bot δεν έχει άδεια να στείλει μηνύματα σε αυτό το κανάλι!");
        return;
    }

    const messages = await channel.messages.fetch();
    const botMessage = messages.find(msg => msg.author.id === client.user.id && msg.embeds.length > 0);

    if (botMessage) {
        await botMessage.edit({ embeds: [embed] });
    } else {
        await channel.send({ embeds: [embed] });
    }
}
