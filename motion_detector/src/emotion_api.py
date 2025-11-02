from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from utils.datasets import get_labels
from utils.inference import detect_faces, apply_offsets, load_detection_model
from utils.preprocessor import preprocess_input
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import os

app = Flask(__name__)

# Disable TensorFlow logs (cleaner console)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
detection_model_path = os.path.join(BASE_DIR, "trained_models", "detection_models", "haarcascade_frontalface_default.xml")
emotion_model_path = os.path.join(BASE_DIR, "trained_models", "emotion_models", "fer2013_mini_XCEPTION.102-0.66.hdf5")

emotion_labels = get_labels('fer2013')
face_detection = load_detection_model(detection_model_path)
emotion_classifier = load_model(emotion_model_path, compile=False)
emotion_target_size = emotion_classifier.input_shape[1:3]

@app.route('/api/detect', methods=['POST'])
def detect_emotion():
    try:
        data = request.get_json()
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        img_data = base64.b64decode(data['image'])
        img = Image.open(BytesIO(img_data)).convert('RGB')
        bgr_image = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        gray_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)

        faces = detect_faces(face_detection, gray_image)
        if len(faces) == 0:
            return jsonify({'emotion': 'no_face_detected'})

        x1, x2, y1, y2 = apply_offsets(faces[0], (20, 40))
        gray_face = gray_image[y1:y2, x1:x2]
        gray_face = cv2.resize(gray_face, emotion_target_size)
        gray_face = preprocess_input(gray_face, True)
        gray_face = np.expand_dims(gray_face, 0)
        gray_face = np.expand_dims(gray_face, -1)

        emotion_prediction = emotion_classifier.predict(gray_face, verbose=0)
        emotion_label_arg = np.argmax(emotion_prediction)
        emotion_text = emotion_labels[emotion_label_arg]

        return jsonify({'emotion': emotion_text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Flask API running fine!'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
