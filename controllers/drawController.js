import prisma from "../config/db.js";

export async function runDailyDraw() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Optional: align to the start of the day

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0); // Optional: align to the start of the day

    // Get all activated receipts from the last 7 days
    const activatedReceipts = await prisma.receipt.findMany({
      where: {
        activated: true,
        activatedAt: { gte: oneWeekAgo },
      },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        uniqueCode: true,
      },
    });

    if (activatedReceipts.length === 0) {
      console.log("No activated receipts this week.");
      return;
    }

    console.log({ activatedReceipts: activatedReceipts.length });
    console.log({ selectedLots: activatedReceipts });
    console.log("..............................");

    // Convert totalAmount to numbers and calculate total
    const totalAmount = activatedReceipts.reduce(
      (sum, receipt) => sum + Number(receipt.totalAmount),
      0
    );

    const randomThreshold = Math.random() * totalAmount;

    let cumulative = 0;
    let winnerReceipt = null;
    for (const receipt of activatedReceipts) {
      cumulative += Number(receipt.totalAmount);
      if (randomThreshold <= cumulative) {
        winnerReceipt = receipt;
        break;
      }
    }

    // Create a new draw record first
    const draw = await prisma.draw.create({
      data: {
        drawDate: today,
        activatedReceipts: {
          connect: activatedReceipts.map(receipt => ({ id: receipt.id })), // Link activated receipts to the draw
        },
      },
    });

    // Save the winner in the database with the created draw
    const winner = await prisma.winner.create({
      data: {
        drawId: draw.id,  // Use the newly created draw's ID
        receiptId: winnerReceipt.id,
      },
    });

    console.log("🎉 Winner Receipt for the Week:", { winnerReceipt });
    console.log("Daily draw completed! Winner:", winner);
  } catch (error) {
    console.error("Error running daily draw:", error);
  }
};