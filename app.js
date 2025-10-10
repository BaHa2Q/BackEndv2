const express = require('express');
const cors = require("cors");
require('reflect-metadata');
require('dotenv').config();

const { AppDataSource } = require('./data-source');
const { AppTokenAuthProvider } = require('@twurple/auth');
const session  = require('express-session');

const userRoutes = require('./routes/ProfileRoutes');
const followRoute = require('./routes/followRoute');
const commandRoute = require('./routes/commandRoute');
const tokenRoute = require('./routes/TokenRoute');
const configRoute = require('./routes/configRoute');
const badWordRoute = require('./routes/BadWordRoute');
const botsRoute = require('./routes/Bots');

const { router: twitchRouter } = require('./routes/twitchWebhookRoute');

const { loadFavoritesFromDB } = require('./controllers/ProfileController');
const { setupSocket } = require('./utils/socket');
const { eventChannel } = require('./utils/Event');

const fs = require('fs');
const http = require('http');

const port = process.env.PORT || 5000;

const app = express();

// Middlewares
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // خليها true لو عندك HTTPS
  })
);
app.use("/api/twitch", express.raw({ type: "application/json" }), twitchRouter); 
app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000"] })); // لاحظ https
app.use('/api/twitch', configRoute);

app.use('/api', configRoute);
app.use('/api/profile', userRoutes);
app.use("/api/follow", followRoute);
app.use("/api/commands", commandRoute);
app.use("/api/badword", badWordRoute);
app.use("/api/bots", botsRoute);
app.use("/api/auth", tokenRoute);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// إعداد HTTPS
const sslOptions = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};

AppDataSource.initialize()
  .then(async () => {
    await loadFavoritesFromDB();
    eventChannel();

    const server = http.createServer(sslOptions, app);
    setupSocket(server);  

    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server ready on port ${port} (https)`);
    });
  })
  .catch(error => console.error("❌ Server failed to start:", error));
