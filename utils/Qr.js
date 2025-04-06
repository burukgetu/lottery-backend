import { createCanvas, loadImage } from "canvas";
import jsQR from "jsqr";

export async function readQRCode(imagePath) {
    try {
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, image.width, image.height);

        return code ? code.data : "No QR code found.";
    } catch (error) {
        throw new Error(`Error reading QR code: ${error.message}`);
    }
}