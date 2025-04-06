from fastapi import FastAPI, UploadFile, File
import easyocr
import cv2
import numpy as np
import shutil

app = FastAPI()

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if using CUDA

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read image using OpenCV
        img = cv2.imread(temp_path)
        if img is None:
            return {"error": "Failed to read image"}

        # Convert to grayscale (optional)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Extract text
        result = reader.readtext(gray)
        extracted_text = "\n".join([detection[1] for detection in result])

        return {"text": extracted_text}
    except Exception as e:
        return {"error": str(e)}


# to run it
# uvicorn utils.ocr_api:app --host 127.0.0.1 --port 8000 --reload