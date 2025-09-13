require('reflect-metadata');
require('dotenv').config();

const express = require('express');
const cors = require("cors");
const http = require("http");
const { AppDataSource } = require('./data-source');
const { AppTokenAuthProvider } = require('@twurple/auth');

const userRoutes = require('./routes/ProfileRoutes');
const followRoute = require('./routes/followRoute');
const commandRoute = require('./routes/commandRoute');
const tokenRoute = require('./routes/TokenRoute');
const configRoute = require('./routes/configRoute');
const { router: twitchRouter } =require('./routes/twitchWebhookRoute');

const { loadFavoritesFromDB } = require('./controllers/ProfileController');
const { setupSocket } = require('./utils/socket');
const { eventChannel } = require('./utils/Event');

const port = process.env.PORT || 5000;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

const app = express();
const server = http.createServer(app); 


app.use("/api/twitch", express.raw({ type: "application/json" }), twitchRouter); 
app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000"] }));
app.use('/api/twitch', configRoute);

app.use('/api', configRoute);
app.use('/api/profile', userRoutes);
app.use("/api/follow", followRoute);
app.use("/api/command", commandRoute);
app.use("/api/auth", tokenRoute);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

AppDataSource.initialize()
  .then(async () => {
    loadFavoritesFromDB();
    eventChannel();
    setupSocket(server);  

    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running at http://localhost:${port}/api`);
    });
  })
  .catch(error => console.error("❌ Failed to start server:", error));
