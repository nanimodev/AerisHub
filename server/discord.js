const { Client, GatewayIntentBits } = require("discord.js");
const { setupMemberPanel, handleMemberInteraction, handleMemberModal } = require("./discordPanels/member");
const { setupAdminPanel, handleAdminInteraction, handleAdminSelectMenu, handleAdminModal } = require("./discordPanels/admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config.env") });

const DISCORD_TOKEN = process.env.TOKEN;

function startDiscordBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
        ],
    });

    client.once("clientReady", () => {
        console.log(`[Discord Bot] Online as ${client.user.tag}`);
        
        // Setup both panels
        setupMemberPanel(client);
        setupAdminPanel(client);
    });

    // Handler for interactions
    client.on("interactionCreate", async (interaction) => {
        try {
            // Button interactions
            if (interaction.isButton()) {
                // Member panel buttons
                if (["redeem_key", "my_keys", "get_script", "get_status"].includes(interaction.customId)) {
                    await handleMemberInteraction(interaction);
                }
                // Admin panel buttons
                else if (["check_key", "generate_key", "delete_key", "get_keys"].includes(interaction.customId) || interaction.customId.startsWith("keys_page_")) {
                    await handleAdminInteraction(interaction);
                }
            }
            // Select menu interactions
            else if (interaction.isStringSelectMenu()) {
                if (interaction.customId === "select_duration") {
                    await handleAdminSelectMenu(interaction);
                }
            }
            // Modal interactions
            else if (interaction.isModalSubmit()) {
                if (["check_key_modal", "delete_key_modal"].includes(interaction.customId)) {
                    await handleAdminModal(interaction);
                }
                else if (interaction.customId === "redeem_key_modal") {
                    await handleMemberModal(interaction);
                }
            }
        } catch (error) {
            console.error("[Discord Bot] Error processing interaction:", error);
            const errorMessage = {
                content: "❌ An error occurred while processing your request.",
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        }
    });

    client.login(DISCORD_TOKEN);

    return client;
}

module.exports = { startDiscordBot };
