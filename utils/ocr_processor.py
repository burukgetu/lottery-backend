import sys
import easyocr
import cv2

# Initialize EasyOCR Reader
reader = easyocr.Reader(['en'], gpu=False)  # You can add more languages if needed, e.g., ['en', 'fr']

def extract_text(image_path):
    try:
        # Step 1: Load the image
        img = cv2.imread(image_path)

        if img is None:
            print("Error: Unable to read the image file.")
            sys.exit(1)

        # Step 2: Convert to grayscale (Optional, might help in some cases)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Step 3: Perform OCR using EasyOCR
        result = reader.readtext(gray)

        # Step 4: Extract and return the text
        extracted_text = "\n".join([detection[1] for detection in result])

        print(extracted_text)  # Print so Node.js can read it
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No image path provided.")
        sys.exit(1)
    
    image_path = sys.argv[1]
    extract_text(image_path)
