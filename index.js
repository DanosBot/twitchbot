require('dotenv').config()
const axios = require('axios').default;
const tmi = require('tmi.js');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.sendStatus(200));

app.listen(port, () => {
   console.log(`listening on ${port}`);
});

const client = new tmi.Client({
	options: { debug: false },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.username,
		password: process.env.password
	},
	channels: process.env.channels.split(' ')
});
client.connect();

// true will timeout message containing gyazo link, false won't
const timeoutGyazoLinks = true;

const gyazoRegex = RegExp('(http(s)?(\:\/\/))?(i.)?gyazo\.com\/[a-zA-Z0-9]+\.[a-zA-Z0-9]+', 'mi')

/**
 * Watch chat messages for gyazo links and the upload to imgur instead
 */
client.on('message', (channel, tags, message, messageUUID, self) => {
    
    if (self || tags.username.toLowerCase() === process.env.username) return;
	if (message.toLowerCase().includes('gyazo.com')) {
        // check if regex match is a gyazo image format or just a reference to the site
        if (message.match(gyazoRegex) !== null) {
            let gyazoLink = message.match(gyazoRegex);

            // some over complicated logic to account for links that are missing elements of the url 
            // but still resolve to a correct gyazo image
            let indexPosition = 0;
            if (gyazoLink.includes('https://')) {
                indexPosition += 8;
            } else if (gyazoLink.includes('http://')) {
                indexPosition += 7;
            }
            if (gyazoLink.includes('i.')) {
                indexPosition += 2;
            }
            // account for 'gyazo.com/'
            indexPosition += 10;

            gyazoLink = gyazoLink[0].toLowerCase().slice(indexPosition);

            if (gyazoLink.includes('.png')) {
                    gyazoLink = `https://i.gyazo.com/${gyazoLink}`
            } else {
                gyazoLink = `https://i.gyazo.com/${gyazoLink}.png`
            }

            // check if bot username is in list of channel mods
            client.mods(channel)
                .then((data) => {
                    console.log(data);
                    // time out gyazo message if user isn't the broadcaster or a mod AND the bot is a mod
                    if (timeoutGyazoLinks && tags.mod === false && tags['badges-raw'] !== 'broadcaster/1' && data.includes(process.env.username.toLowerCase())) {
                        client.deletemessage(channel, tags.id)
                            .then(() => {
                                console.log(`gyazo link removed from user "${tags.username}" in ${channel}`);
                            }).catch((err) => {
                                console.log(`Could not remove gyazo link in ${channel}`, err);
                            });
                    }
                }).catch(() => {
                    console.log(`Could not remove gyazo link. Not a mod in ${channel}`);
                });

            // upload image to imgur
            axios.post('https://api.imgur.com/3/upload', {
                    image: gyazoLink,
            }, {
                headers: { Authorization: `Bearer ${process.env.imgurAccessToken}` }
            })
                // write chat message containing new imgur url
                .then((response) => {
                    console.log(`imgur upload successful in ${channel}`);
                    client.say(channel, `@${tags.username}, Uploaded your image ${response.data.data.link} don't use gyazo, use getsharex.com/ instead.`);
                })
                // write chat message with sharex download url
                .catch((err) => {
                    console.log(`imgur upload failed in ${channel}`, err);
                    client.say(channel, `@${tags.username}, use getsharex.com/ instead of gyazo!`);
                });
        } else {
            client.say(channel, `@${tags.username}, use getsharex.com/ instead of gyazo!`);
        }
    }
});
