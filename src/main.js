require('./index');

const { client } = require('./index');
const { startServer, setDiscordClient } = require('./web/server');
const { seedDatabase } = require('./lethe/letheStorage');

client.once('ready', async () => {
  setDiscordClient(client);
  startServer();
  await seedDatabase();
  console.log('All systems started');
});
