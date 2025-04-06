import Tesseract from "tesseract.js";
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';

async function extractTextByTesseract(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng'); // Specify 'eng' or another language
    return text;
  } catch (error) {
    console.error("OCR Processing Error:", error);
    throw new Error("Failed to process image text.");
  }
}

function extractReceiptDetails(text) {
  // Use regular expressions to extract receipt details
  const tinMatch = text.match(/TIN\s*[:|-]?\s*(\d+)/i);
  const fsMatch = text.match(/FS\s*(No|N0)\.\s*(\d+)/i);
  const dateMatch = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  const totalMatch = text.match(/Total\s*[\*\+\#\/]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  const ercaMatch = text.match(/ERCA\s*\n?.*?(\w{8,})/i);
  let total;
  if (totalMatch) {
    total = parseFloat(totalMatch[1].replace(/,/g, ''))
  }

  return {
    tinNumber: tinMatch ? tinMatch[1] : null,
    fsNumber: fsMatch ? fsMatch[2] : null,
    date: dateMatch ? dateMatch[1] : null,
    totalAmount: total ? total : null,
    ercaNumber: ercaMatch ? ercaMatch[1] : null,
  };
}

// Export functions correctly
export { extractTextByTesseract, extractReceiptDetails };
