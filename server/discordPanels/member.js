const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { checkKey, deleteKey } = require("../database/keyManager");
const { getOrCreateUser, addUserKey, getUserKeys, removeExpiredKeys } = require("../discordModules/database");

const MEMBER_CHANNEL_ID = "1437107131538210939";

function getStatusData() {
    try {
        const statusPath = path.join(__dirname, "..", "status.json");
        const data = fs.readFileSync(statusPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("[Discord Bot] Error reading status.json:", error);
        return null;
    }
}

async function setupMemberPanel(client) {
    try {
        const channel = await client.channels.fetch(MEMBER_CHANNEL_ID);
        if (!channel) {
            console.error(`[Discord Bot] Channel ${MEMBER_CHANNEL_ID} not found`);
            return;
        }

        // Check if panel already exists
        const messages = await channel.messages.fetch({ limit: 10 });
        const existingPanel = messages.find(msg => 
            msg.author.id === client.user.id && 
            msg.embeds.length > 0 &&
            msg.embeds[0].title === "Aeris Hub | Panel"
        );

        if (existingPanel) {
            console.log(`[Discord Bot] Member panel already exists in channel`);
            return;
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle("Aeris Hub | Panel")
            .setDescription("Control panel to manage keys and get information")
            .setColor(0x00AE86);

        // Create buttons
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("redeem_key")
                    .setLabel("Redeem Key")
                    .setEmoji("🔑")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("my_keys")
                    .setLabel("My Keys")
                    .setEmoji("🗝️")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("get_script")
                    .setLabel("Get Script")
                    .setEmoji("📜")
                    .setStyle(ButtonStyle.Success)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("get_status")
                    .setLabel("Get Status")
                    .setEmoji("📊")
                    .setStyle(ButtonStyle.Secondary)
            );

        // Send panel
        await channel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        console.log(`[Discord Bot] Member panel created successfully in channel ${MEMBER_CHANNEL_ID}`);
    } catch (error) {
        console.error(`[Discord Bot] Error setting up member panel:`, error);
    }
}

async function handleMemberInteraction(interaction) {
    if (interaction.customId === "redeem_key") {
        // Show modal to input key
        const modal = new ModalBuilder()
            .setCustomId("redeem_key_modal")
            .setTitle("Redeem Key");

        const keyInput = new TextInputBuilder()
            .setCustomId("key_input")
            .setLabel("Enter your key")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("aeris...")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(keyInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
    }

    if (interaction.customId === "my_keys") {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Ensure user exists
        getOrCreateUser(userId, username);

        // Remove expired keys
        const removedCount = removeExpiredKeys(userId);
        
        // Get user keys
        const userKeys = getUserKeys(userId);

        const embed = new EmbedBuilder()
            .setTitle("🗝️ My Keys")
            .setDescription(userKeys.length === 0 ? "You don't have any active keys." : "Here are your active keys:")
            .setColor(0x00AE86)
            .setTimestamp();

        if (userKeys.length > 0) {
            const now = new Date();
            
            for (const keyData of userKeys) {
                const expiresAt = new Date(keyData.expires_at);
                const isExpired = expiresAt < now;
                const timeRemaining = isExpired ? "Expired" : formatTimeRemaining(expiresAt - now);

                embed.addFields({
                    name: `Key: ${keyData.key}`,
                    value: `**Duration:** ${keyData.duration_minutes} minutes\n**Redeemed:** <t:${Math.floor(new Date(keyData.redeemed_at).getTime() / 1000)}:R>\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>\n**Status:** ${isExpired ? "🔴 Expired" : "🟢 Active"}\n\u200B`,
                    inline: false
                });
            }

            if (removedCount > 0) {
                embed.setFooter({ text: `${removedCount} expired key(s) were automatically removed` });
            }
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

        console.log(`[Discord Bot] ${interaction.user.tag} viewed their keys`);
        return;
    }

    if (interaction.customId === "get_status") {
        const statusData = getStatusData();
        
        if (!statusData) {
            await interaction.reply({
                content: "❌ Error loading status information.",
                ephemeral: true
            });
            return;
        }

        // Create embed with status information
        const statusEmbed = new EmbedBuilder()
            .setTitle("📊 Scripts Status")
            .setDescription("Current status of all supported games")
            .setColor(0x00AE86)
            .setTimestamp();

        // Add field for each game
        for (const [game, info] of Object.entries(statusData)) {
            const statusEmoji = info.statusColor === "green" ? "🟢" : 
                               info.statusColor === "red" ? "🔴" : 
                               info.statusColor === "orange" ? "🟠" : "⚪";
            
            const keyEmoji = info.keyStatus === "Premium" ? "⭐" : "🆓";
            
            statusEmbed.addFields({
                name: `${statusEmoji} ${game}`,
                value: `**Status:** ${info.status}\n**Key Type:** ${keyEmoji} ${info.keyStatus}\n\u200B`,
                inline: false
            });
        }

        await interaction.reply({
            embeds: [statusEmbed],
            ephemeral: true
        });

        console.log(`[Discord Bot] ${interaction.user.tag} checked status`);
    }
}

async function handleMemberModal(interaction) {
    if (interaction.customId === "redeem_key_modal") {
        const key = interaction.fields.getTextInputValue("key_input").trim();
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Check if key exists in database
        const keyData = checkKey(key);

        if (!keyData) {
            await interaction.reply({
                content: "❌ Invalid key! This key does not exist or has already been used.",
                ephemeral: true
            });
            console.log(`[Discord Bot] ${interaction.user.tag} tried to redeem invalid key: ${key}`);
            return;
        }

        // Ensure user exists
        getOrCreateUser(userId, username);

        // Add key to user's keys
        const result = addUserKey(userId, key, keyData.duration_minutes);

        if (!result.success) {
            await interaction.reply({
                content: "❌ Error redeeming key. Please try again later.",
                ephemeral: true
            });
            return;
        }

        // Remove key from keys database
        deleteKey(key);

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + keyData.duration_minutes * 60 * 1000);

        const successEmbed = new EmbedBuilder()
            .setTitle("✅ Key Redeemed Successfully!")
            .setDescription(`You have successfully redeemed the key!`)
            .setColor(0x00FF00)
            .addFields(
                { name: "Key", value: `\`${key}\``, inline: false },
                { name: "Duration", value: `${keyData.duration_minutes} minutes`, inline: true },
                { name: "Expires", value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [successEmbed],
            ephemeral: true
        });

        console.log(`[Discord Bot] ${interaction.user.tag} redeemed key: ${key} (${keyData.duration_minutes} minutes)`);
    }
}

function formatTimeRemaining(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

module.exports = { setupMemberPanel, handleMemberInteraction, handleMemberModal };
