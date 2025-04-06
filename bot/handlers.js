import axios from "axios";
import path from "path"
import fs from "fs"
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now you can use __dirname to resolve paths correctly
const uploadDir = resolve(__dirname, 'uploads');
console.log('Upload Directory:', uploadDir);

export const handleStart = async (bot, msg) => {
    const telegramId = msg.chat.id;

    try {
        // Check if user exists in the database
        const response = await axios.get(`${process.env.API_URL}/api/get-telegram-user/${telegramId}`);

        if (response.data.exists) {
            bot.sendMessage(msg.chat.id, "✅ You're already registered!");
        } else {
            bot.sendMessage(msg.chat.id, "📲 Please share your phone number.", {
                reply_markup: {
                    keyboard: [[{ text: "📞 Share Phone Number", request_contact: true }]],
                    one_time_keyboard: true,
                },
            });
        }
    } catch (error) {
        bot.sendMessage(msg.chat.id, "❌ Error checking your status.");
    }
};

export const handleContact = async (bot, msg) => {
    const phoneNumber = msg.contact.phone_number;
    const telegramId = msg.contact.user_id;

    try {
        await axios.post(`${process.env.API_URL}/api/store-telegram-user`, {
            telegramId,
            phoneNumber,
        });
        bot.sendMessage(msg.chat.id, "✅ Your phone number has been saved!");
    } catch (error) {
        console.log(error)
        bot.sendMessage(msg.chat.id, "❌ Error saving your phone number.");
    }
};

// Ensure the 'uploads' directory exists
export const handlePhoto = async (bot, msg) => { 
    const telegramId = msg.chat.id;
    const fileId = msg.photo.pop().file_id;

    try {
        // Step 1: Get the file URL from Telegram
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        // Step 2: Download the image from Telegram
        const filePath = path.join(uploadDir, `${fileId}.jpg`);
        
        // Ensure 'uploads' directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create 'uploads' directory if it doesn't exist
        }

        const writer = fs.createWriteStream(filePath);
        const response = await axios({ url: fileUrl, method: "GET", responseType: "stream" });

        response.data.pipe(writer);

        writer.on("finish", async () => {
            // Step 3: Send the image to the backend for OCR and processing
            const formData = new FormData();
            formData.append("image", fs.createReadStream(filePath));
            formData.append("telegramUserId", telegramId); // Include user ID to track the sender

            try {
                const uploadResponse = await axios.post("http://localhost:5000/receipts/telegram/upload", formData, {
                    headers: formData.getHeaders(),
                });

                const uniqueCode = JSON.stringify(uploadResponse.data.uniqueCode)
                // console.log({unicode})
                if (uploadResponse.data.message) {
                    const message = `
                    ✅ Receipt uploaded successfully!
                    Your unique code is: \`${uniqueCode}\` (copiable text)

                    Copy this code and send it to the short code 0000 via SMS to activate your ticket for the draw.
                    `;
                    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' })
                    // bot.sendMessage(msg.chat.id, `✅ Receipt uploaded successfully! Details: ${JSON.stringify(uploadResponse.data.message)}`);
                } else {
                    bot.sendMessage(msg.chat.id, "❌ Error processing your receipt.");
                }
            } catch (error) {
                console.log({error})
                bot.sendMessage(msg.chat.id, `❌ Error ${JSON.stringify(error.response.data.message)}`);
                // bot.sendMessage(msg.chat.id, "❌ Error uploading your receipt.");
            }

            // Clean up the temporary file
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.log(error);
        bot.sendMessage(msg.chat.id, "❌ Error downloading your receipt.");
    }
};