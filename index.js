const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
const cv = require('opencv4nodejs');
const https = require('https');
const Stream = require('stream').Transform;
const fs = require('fs');
const frontFaceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_DEFAULT);
const eyeClassifier = new cv.CascadeClassifier(cv.HAAR_EYE);
// userRe is RegExp for @ed user
const userRe = /<@!?\d{18}>/;
const regID = /\d{18}/;

client.once('ready', () => {
    console.log('Logged in');
    client.user.setPresence({
        status: 'online',
        activity: { name: '!!help', type: 'PLAYING' },
    });
});

function faceDet(imageIn, channel) {
    console.log(imageIn);
    https.request(imageIn.replace('.webp', '.png'), (response) => {
        const data = new Stream();
        response.on('data', (d) => {
            console.log(`Received ${d.length} bytes of data.`);
            data.push(d);
        });
        response.on('end', () => {
            fs.writeFileSync('temp/image.png', data.read());
            if(cv.imread('temp/image.png') === null) {
                return;
            }
            const mat = cv.imread('temp/image.png');
            const matGray = mat.bgrToGray();
            frontFaceClassifier.detectMultiScaleAsync(matGray, (err, res)=> {
                // error catch here
                res.objects.forEach(t => {
                    console.log(`x = ${t.x}`);
                    console.log(`y = ${t.y}`);
                    console.log(`width = ${t.width}`);
                    console.log(`height = ${t.height}`);
                    console.log('--------------');
                    const point1 = new cv.Point2(t.x, t.y);
                    const point2 = new cv.Point2(t.x + t.width, t.y + t.height);
                    mat.drawRectangle(point1, point2, new cv.Vec(255, 0, 0));
                });
                cv.imwrite('temp/img.png', mat);
            });
            // time to write to eyes
            eyeClassifier.detectMultiScaleAsync(matGray, (err, res)=> {
                let inte = 0;
                res.objects.forEach(t => {
                    if (inte++ < 2) {
                        console.log(`EYE ${inte}`);
                        console.log(`x = ${t.x}`);
                        console.log(`y = ${t.y}`);
                        console.log(`width = ${t.width}`);
                        console.log(`height = ${t.height}`);
                        console.log('--------------');
                        const point1 = new cv.Point2(t.x, t.y);
                        const point2 = new cv.Point2(t.x + t.width, t.y + t.height);
                        mat.drawRectangle(point1, point2, new cv.Vec(255, 0, 0));
                    }
                });
                cv.imwriteAsync('temp/img.png', mat, ()=>{
                    // async
                    const attachment = new Discord.MessageAttachment('temp/img.png');
                    channel.send(attachment);
                });
            });
        });
    }).end();
}

client.on('message', m => {
    if(!m.content.startsWith(prefix) || m.author.bot)return;
    const args = m.content.split(' ');
    const passesIDTest = userRe.test(args[1]) || regID.test(args[1]);
    if(args[0].toLowerCase() === `${prefix}pfp`) {
        if(passesIDTest) {
            const id = args[1].match(regID)[0];
            m.guild.members.fetch(id).then(gMember=>{
                m.channel.send({
                    files: [gMember.user.displayAvatarURL()]
                // .replace('.webp', '.jpg')]
                // change the format of the file.
                }).then().catch();
            });
        }else if(args.length === 1) {
            m.channel.send({
                files: [m.author.displayAvatarURL()]
            }).then().catch();
        }

    }else if(args[0].toLowerCase() === `${prefix}facedet`) {
        if(passesIDTest) {
            const id = args[1].match(regID)[0];
            m.guild.members.fetch(id).then(gMember=>{
                faceDet(gMember.user.displayAvatarURL(), m.channel);
            });
        }else if(args.length === 1) {
            faceDet(m.author.displayAvatarURL(), m.channel);
        }
    }else if(args[0] === `${prefix}ping`) {
        m.channel.send('Pong!.. I dont want to find the delay so this is what you\'re going to deal with');
    }
});

client.login(token);