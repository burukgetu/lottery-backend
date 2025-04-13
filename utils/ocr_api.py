from fastapi import FastAPI, UploadFile, File
import easyocr
import cv2
import numpy as np

app = FastAPI()

# Initialize EasyOCR reader once
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if available

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        # Read file contents into memory
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)

        # Decode image from memory
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Failed to decode image"}

        # Optional: resize large images to speed up OCR
        max_dim = max(img.shape[:2])
        if max_dim > 1024:
            scale = 1024 / max_dim
            new_w = int(img.shape[1] * scale)
            new_h = int(img.shape[0] * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Run OCR
        result = reader.readtext(gray)
        extracted_text = "\n".join([text[1] for text in result])

        return {"text": extracted_text}
    except Exception as e:
        return {"error": str(e)}
