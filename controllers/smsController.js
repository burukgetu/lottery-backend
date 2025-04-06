import prisma from "../config/db.js";

async function receiveSMS(req, res) {
  const { phone, message } = req.body;

  if (/GAD-[a-zA-Z0-9]+-\d/i.test(message)) {

    const existingReceipt = await prisma.receipt.findUnique({
      where : { 
        uniqueCode: message,
        activated: true
      }
    })

    if(existingReceipt) {
      return res.status(400).json({ message: "Receipt already activated" })
    }

    const receipt = await prisma.receipt.findUnique({ where: { uniqueCode: message } });
    if (!receipt) return res.status(400).json({ message: "Invalid unique code." });

    const today = new Date();
    await prisma.receipt.update({
      where: { uniqueCode: message },
      data: { 
        activated: true,
        activatedAt: today ,
        activation: { create: {} } },
    });

    return res.json({ message: "Receipt activated successfully!" });
  } 
  
  const [tinNumber, fsNumber] = message.split(" ");
  if (tinNumber && fsNumber) {
    await prisma.receiptsFromSMS.create({ 
      data: { phone, tinNumber, fsNumber } 
    });
    return res.json({ message: "Receipt data saved from SMS!" });
  }

  res.status(400).json({ message: "Invalid SMS format." });
}

export { receiveSMS };
