from flask import Flask, request, jsonify
import tensorflow_hub as hub
import numpy as np
import librosa
import pandas as pd
from flask_cors import CORS
import tempfile
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)

# Load YAMNet model
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')

# Load class names
class_names_url = 'https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv'
class_names = pd.read_csv(class_names_url)['display_name'].tolist()

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_audio(audio_data):
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            audio_data.save(tmp.name)
            tmp_file_path = tmp.name

        try:
            audio = AudioSegment.from_file(tmp_file_path)
        except Exception as e:
            raise ValueError(f"FFmpeg failed to process the input file. Ensure the file is valid. Error: {str(e)}")

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as converted_tmp:
            audio.export(converted_tmp.name, format="wav")
            converted_tmp_file_path = converted_tmp.name

        y, sr = librosa.load(converted_tmp_file_path, sr=16000, mono=True)
        return y

    except Exception as e:
        raise ValueError(f"Error processing audio file: {e}")

@app.route('/siren-detection', methods=['POST'])
def siren_detection():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    if not allowed_file(audio_file.filename):
        return jsonify({'error': 'Invalid file format. Supported formats: WAV, MP3, OGG, FLAC.'}), 400

    try:
        waveform = preprocess_audio(audio_file)
        scores, embeddings, spectrogram = yamnet_model(waveform)
        segment_classes = np.argmax(scores.numpy(), axis=1)
        predicted_classes = [class_names[idx] for idx in segment_classes]

        is_siren = any('siren' in cls.lower() for cls in predicted_classes)
        result = "Siren detected" if is_siren else "No siren detected"
        return jsonify({'result': result})

    except ValueError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='192.168.1.12')
