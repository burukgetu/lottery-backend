import prisma from "../config/db.js";

export const storeTelegramUser = async (req, res) => {
    try {
        const { telegramId, phoneNumber } = req.body;

        // Ensure telegramId is treated as a string
        const telegramIdStr = String(telegramId);

        let user = await prisma.telegramUser.findUnique({ where: { telegramId: telegramIdStr } });

        if (!user) {
            user = await prisma.telegramUser.create({ data: { telegramId: telegramIdStr, phoneNumber } });
        } else {
            user = await prisma.telegramUser.update({ where: { telegramId: telegramIdStr }, data: { phoneNumber } });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getTelegramUser = async (req, res) => {
    const { telegramId } = req.params;

    try {
        const user = await prisma.telegramUser.findUnique({ where: { telegramId } });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ exists: false, message: "Server error" });
    }
};