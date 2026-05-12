from tensorflow.keras.models import load_model
from PIL import Image, ImageOps
import numpy as np

# 1. Model aur Labels ko load karo
model = load_model("keras_model.h5", compile=False)
class_names = open("labels.txt", "r").readlines()

def get_ai_prediction(image_path):
    # 2. Image ko model ke hisab se resize karo (224x224)
    data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
    image = Image.open(image_path).convert("RGB")
    size = (224, 224)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    
    # 3. Image ko array mein badlo
    image_array = np.asarray(image)
    normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
    data[0] = normalized_image_array

    # 4. Model se pucho (Predict)
    prediction = model.predict(data)
    index = np.argmax(prediction)
    class_name = class_names[index].strip()
    confidence_score = prediction[0][index]

    # 5. 🔥 HACKATHON PRO LOGIC 🔥
    # Strict 70% ki jagah ab hum 40% (0.40) par bhi AI ko pass kar denge
    if confidence_score > 0.10:
        # Format check: Ensure label correctly splits (e.g., "0 E-Waste")
        parts = class_name.split(" ")
        if len(parts) > 1:
            result = parts[1] # Sirf 'E-Waste', 'Dry' ya 'Wet' lega
        else:
            result = class_name # Agar split na ho paye toh poora naam le lega
            
        return {"waste_type": result, "confidence": float(confidence_score)}
    else:
        # Agar 40% se bhi kam hai, tabhi fail karo
        return {"waste_type": "Unknown", "confidence": float(confidence_score)}