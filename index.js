require('dotenv').config()
const axios = require('axios').default;
const tmi = require('tmi.js');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`listening on ${port}`);
});

const client = new tmi.Client({
	options: { debug: process.env.hasDebugMode },
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
    if (self || tags.username === 'danosbot') return;
	if (message.toLowerCase().includes('gyazo.com')) {
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

        if (timeoutGyazoLinks && tags.mod === false) {
            // time out gyazo message
            client.deletemessage(channel, tags.id);
        }

        // upload image to imgur
        axios.post('https://api.imgur.com/3/upload', {
                image: gyazoLink,
        }, {
            headers: { Authorization: `Bearer ${process.env.imgurAccessToken}` }
        })
            // write chat message containing new imgur url
            .then((response) => {
                console.log(response);
                client.say(channel, `@${tags.username}, Uploaded your image ${response.data.data.link} don't use gyazo.`);
            })
            // write chat message with sharex url
            .catch((error) => {
                console.log(error);
                client.say(channel, `@${tags.username}, use https://getsharex.com/ instead!`);
            });
    }
});
