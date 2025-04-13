import prisma from "../config/db.js";
// import { extractReceiptDetails } from "../utils/ocrProcessor.js";
// import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { readQRCode } from "../utils/Qr.js";
import { extractTextByTesseract } from "../utils/ocrProcessor.js";

// async function uploadReceipt(req, res) {
//   const imagePath = req.file ? req.file.path : null;
//   try {
//     const { userId } = req.body;
//     // const imagePath = req.file ? req.file.path : null;

//     if (!imagePath) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     const text = await extractTextFromImage(imagePath);
//     const details = extractReceiptDetails(text);

//     console.log({text});

//     if (!details.tinNumber) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "tin number missing" });
//     }
//     console.log({tin: details.tinNumber})

//     if (!details.fsNumber) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "fs number missing" });
//     }
//     console.log({fs: details.fsNumber})

//     if (!details.ercaNumber) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "erca number missing" });
//     }
//     console.log({erca: details.ercaNumber})

//     if (!details.date) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "date missing" });
//     }
//     console.log({date: details.date})

//     if (!details.totalAmount) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "total amount missing" });
//     }
//     console.log({total: details.totalAmount})

    
//     // Convert to yyyy-mm-dd format
//     const [day, month, year] = details.date.split('/');
//     const formattedDate = `${year}-${month}-${day}`;
    
//     const existingReceipt = await prisma.receipt.findFirst({
//       where: { 
//         tinNumber: details.tinNumber,
//         fsNumber: details.fsNumber
//       },
//     });
    
//     if (existingReceipt) {
//       fs.unlinkSync(imagePath);
//       return res.status(400).json({ message: "Receipt already exists." });
//     }
//     // return res.status(400).json({ message: "Extraction Finished" });

//     // Check if merchant exists, otherwise create a new merchant
//     let merchant = await prisma.merchant.findUnique({
//         where: { tinNumber: details.tinNumber },
//       });
    
//     if (!merchant) {
//       merchant = await prisma.merchant.create({
//         data: { tinNumber: details.tinNumber },
//     });
//     }

//     const uniqueCode = `GAD-${details.ercaNumber}-${Date.now()}`;

//     const receipt = await prisma.receipt.create({
//       data: {
//         userId,
//         merchantId: merchant.id,
//         tinNumber: details.tinNumber,
//         fsNumber: details.fsNumber,
//         date: new Date(formattedDate),
//         totalAmount: details.totalAmount,
//         ercaNumber: details.ercaNumber,
//         uniqueCode,
//         extractedText: text,
//         imageUrl: imagePath,
//       },
//     });

//     res.json({ message: "Receipt uploaded successfully!", receipt, merchant });
//   } catch (error) {
//     fs.unlinkSync(imagePath);
//     console.error(error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// }

async function uploadReceipt(req, res) {
  const imagePath = req.file ? req.file.path : null;

  async function extractTextFromImage(imagePath) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(imagePath));
  
      const response = await axios.post("http://127.0.0.1:8000/ocr", formData, {
        headers: formData.getHeaders(),  // Correct usage of getHeaders() with form-data
      });
  
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Replace all '\n' with a space in the extracted text
      const extractedText = response.data.text.replace(/\n/g, ' ');
      // Replace unwanted characters
      const cleanedText = extractedText.replace(/[@_*\\'"]/g, '').replace(/,/g, '.');
  
      return cleanedText;
    } catch (error) {
      throw new Error(`OCR Error: ${error.message}`);
    }
  }

  try {
    const { userId } = req.body;

    if (!imagePath) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    let text;
    
    if ( process.env.EXTRACT_TYPE === 'node') {
      text = await extractTextByTesseract(imagePath);
    } else {
      text = await extractTextFromImage(imagePath);
    }
    // fs.unlinkSync(imagePath);
    console.log({text});
    // res.json({ message: "extracted text", text});

    const tinMatch = text.match(/TIN[:\s]+(\d{5,})/i); // Matches 9+ digit TIN number
    // const fsNoMatch = text.match(/FS No[:.\s]+(\d+)/i); // Matches FS No
    const fsNoMatch = text.match(/FS\s*[-:]?\s*N[0o]\.?\s*[:\-]?\s*(\d+)/i); // Matches FS No
    const dateMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/); // Matches DD/MM/YYYY date format
    // const totalMatch = text.match(/TOTAL[:\s]+([\d,.]+)/i); // Matches TOTAL amount
    const totalMatch = text.match(/TOTAL\s*[:#*\-]?\s*([\d,]+\.\d{2}|\d+)/i); // Matches TOTAL amount
    const ercaMatch = text.match(/\b(ERCA|ERLA)\s+([A-Z0-9]+)/i); // Matches ERCA or ERLA code
    
    let totalAmount = totalMatch ? totalMatch[1].replace(/,/g, '.') : null;

    
    const tin = tinMatch ? tinMatch[1] : null
    const fsNo = fsNoMatch ? fsNoMatch[1] : null
    const date = dateMatch ? dateMatch[0] : null
    const total = totalAmount
    const erca = ercaMatch ? ercaMatch[2] : null
    

    const qrcode = await readQRCode(imagePath);
    console.log({qrcode})
    
    // fs.unlinkSync(imagePath);

    console.log({ tin })
    console.log({ fsNo })
    console.log({erca: erca})
    console.log({date: date})
    console.log({total: total})

    if (!tin) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "tin number missing" });
    }

    if (!fsNo) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "fs number missing" });
    }

    if (!erca) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "erca number missing" });
    }

    if (!date) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "date missing" });
    }

    if (!total) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "total amount missing" });
    }

    
    // // Convert to yyyy-mm-dd format
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    
    const existingReceipt = await prisma.receipt.findFirst({
      where: { 
        tinNumber: tin,
        fsNumber: fsNo
      },
    });
    
    if (existingReceipt) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "Receipt already exists." });
    }
    // return res.status(400).json({ message: "Extraction Finished" });

    // Check if merchant exists, otherwise create a new merchant
    let merchant = await prisma.merchant.findUnique({
        where: { tinNumber: tin },
      });
    
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: { tinNumber: tin },
    });
    }

    const uniqueCode = `GAD-${erca}-${Date.now()}`;

    const receipt = await prisma.receipt.create({
      data: {
        userId,
        merchantId: merchant.id,
        tinNumber: tin,
        fsNumber: fsNo,
        date: new Date(formattedDate),
        totalAmount: total,
        ercaNumber: erca,
        uniqueCode,
        extractedText: text,
        imageUrl: imagePath,
      },
    });
    res.json({ message: "Receipt uploaded successfully!", receipt, merchant });
  } catch (error) {
    fs.unlinkSync(imagePath);
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
}

async function uploadTelegramReceipt(req, res) {
  const imagePath = req.file ? req.file.path : null;

  async function extractTextFromImage(imagePath) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(imagePath));
  
      const response = await axios.post("http://127.0.0.1:8000/ocr", formData, {
        headers: formData.getHeaders(),  // Correct usage of getHeaders() with form-data
      });
  
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Replace all '\n' with a space in the extracted text
      const extractedText = response.data.text.replace(/\n/g, ' ');
      // Replace unwanted characters
      const cleanedText = extractedText.replace(/[@_*\\'"]/g, '').replace(/,/g, '.');
  
      return cleanedText;
    } catch (error) {
      throw new Error(`OCR Error: ${error.message}`);
    }
  }

  try {
    const { telegramUserId } = req.body;

    if (!imagePath) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // const text = await extractTextByTesseract(imagePath);
    const text = await extractTextFromImage(imagePath);

    // fs.unlinkSync(imagePath);
    console.log({text});
    // res.json({ message: "extracted text", text});

    const tinMatch = text.match(/TIN[:\s]+(\d{5,})/i); // Matches 9+ digit TIN number
    // const fsNoMatch = text.match(/FS No[:.\s]+(\d+)/i); // Matches FS No
    const fsNoMatch = text.match(/FS\s*[-:]?\s*N[0o]\.?\s*[:\-]?\s*(\d+)/i); // Matches FS No
    const dateMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/); // Matches DD/MM/YYYY date format
    // const totalMatch = text.match(/TOTAL[:\s]+([\d,.]+)/i); // Matches TOTAL amount
    const totalMatch = text.match(/TOTAL\s*[:#*\-]?\s*([\d,]+\.\d{2}|\d+)/i); // Matches TOTAL amount
    const ercaMatch = text.match(/\b(ERCA|ERLA)\s+([A-Z0-9]+)/i); // Matches ERCA or ERLA code
    
    let totalAmount = totalMatch ? totalMatch[1].replace(/,/g, '.') : null;

    
    const tin = tinMatch ? tinMatch[1] : null
    const fsNo = fsNoMatch ? fsNoMatch[1] : null
    const date = dateMatch ? dateMatch[0] : null
    const total = totalAmount
    const erca = ercaMatch ? ercaMatch[2] : null
    

    const qrcode = await readQRCode(imagePath);
    console.log({qrcode})
    
    // fs.unlinkSync(imagePath);

    console.log({ tin })
    console.log({ fsNo })
    console.log({ erca })
    console.log({ date })
    console.log({ total })

    if (!tin) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "tin number missing" });
    }

    if (!fsNo) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "fs number missing" });
    }

    if (!erca) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "erca number missing" });
    }

    if (!date) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "date missing" });
    }

    if (!total) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "total amount missing" });
    }

    
    // // Convert to yyyy-mm-dd format
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    
    const existingReceipt = await prisma.receipt.findFirst({
      where: { 
        tinNumber: tin,
        fsNumber: fsNo
      },
    });
    
    if (existingReceipt) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "Receipt already exists." });
    }
    // return res.status(400).json({ message: "Extraction Finished" });

    // Check if merchant exists, otherwise create a new merchant
    let merchant = await prisma.merchant.findUnique({
        where: { tinNumber: tin },
      });
    
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: { tinNumber: tin },
    });
    }

    const uniqueCode = `GAD-${erca}-${Date.now()}`;

    // finding the telegram users Id
    const userId = await prisma.telegramUser.findUnique({
      where: {
        telegramId: telegramUserId, // replace with actual telegramId
      },
      select: {
        id: true,
      },
    }).then(user => user?.id);

    const receipt = await prisma.receipt.create({
      data: {
        telegramUserId: userId,
        merchantId: merchant.id,
        tinNumber: tin,
        fsNumber: fsNo,
        date: new Date(formattedDate),
        totalAmount: total,
        ercaNumber: erca,
        uniqueCode,
        extractedText: text,
        imageUrl: imagePath,
      },
    });
    res.json({ message: "Receipt uploaded successfully!", uniqueCode });
  } catch (error) {
    fs.unlinkSync(imagePath);
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export { uploadReceipt, uploadTelegramReceipt };