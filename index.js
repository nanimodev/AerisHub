const { startRobloxServer } = require("./server/roblox");
const { startDiscordBot } = require("./server/discord");

console.log("=== AerisHub Starting ===");

// Iniciar servidor Roblox (validação de keys)
startRobloxServer();

// Iniciar bot do Discord
startDiscordBot();

console.log("=== All services started ===");