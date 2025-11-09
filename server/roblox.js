const http = require("http");
const url = require("url");

const validKeys = ["VALID-KEY-123", "VALID-KEY-456"];

const KEY_PREFIX = "AERIS-";
const KEY_LENGTH = 16;

// Functions
function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = KEY_PREFIX;
    for (let i = 0; i < KEY_LENGTH; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function startRobloxServer() {
    const server = http.createServer((req, res) => {
        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        if (req.method === "GET" && pathname === "/validate") {
            const key = parsedUrl.query.key;

            if (!key) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Missing key" }));
            }

            const isValid = validKeys.includes(key);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ valid: isValid }));
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(3000, "0.0.0.0", () => {
        console.log("[Roblox Server] Running on port 3000");
    });

    return server;
}

module.exports = { startRobloxServer, generateKey, validKeys };
