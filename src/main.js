require('./index');

const { client } = require('./index');
const { startServer, setDiscordClient } = require('./web/server');

client.once('ready', () => {
  setDiscordClient(client);
  startServer();
});
