# twitchbot

This repo can be used to run a [twitch.tv](https://www.twitch.tv/) chat bot using the [tmi.js](https://tmijs.com/) package. It's main feature is to delete messages that contain `gyazo.com` links and upload the image to [imgur](https://imgur.com/) and also paste the new imgur link in the chat.

## Bug reports
Bug reports can be sent to danosbot@gmail.com

## Prerequisites 
* [Twitch Account](https://www.twitch.tv/)
* [tmi.js token](https://twitchapps.com/tmi/)
* [Imgur Access Token](https://api.imgur.com/oauth2)
* [Node](https://nodejs.org/en/)

## Development

To run this bot locally use the following steps:
Clone the repo
```bash
git clone https://github.com/DanosBot/twitchbot.git
```

Navigate into the directory
```bash
cd twitchbot/
```

Copy example env file and fill in the environment variables with your own credentials/tokens.
```bash
cp .env.example .env
```

Run the bot locally:
```bash
node index.js
```

The node server will need to be restarted for changes to take effect unless a service like `nodemon` or similar is being used.

The repo also contains a `Procfile` for hosting on Heroku

