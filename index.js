const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
// userRe is RegExp for @ed user
const userRe = /<@!?\d{18}>/;

client.once('ready', () => {
    console.log('Logged in');
    client.user.setPresence({
        status: 'online',
        activity: { name: '!!help', type: 'PLAYING' },
    });
});


client.on('message', m => {
    if(!m.content.startsWith(prefix) || m.author.bot)return;
    const args = m.content.split(' ');
    if(args[0].toLowerCase() === `${prefix}pfp` && userRe.test(args[1])) {
        const id = args[1].match(/\d{18}/)[0];
        m.guild.members.fetch(id).then(gMember=>{
            m.channel.send({
                files: [gMember.user.displayAvatarURL()]
            }).then(console.log)
                .catch(console.error);
        });
    }
});

client.login(token);