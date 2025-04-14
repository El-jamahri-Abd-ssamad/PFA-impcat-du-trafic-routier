import os
from flask import Blueprint, request, jsonify
import speech_recognition as sr # type: ignore
import pyttsx3 # type: ignore
import threading
from huggingface_hub import InferenceClient  # type: ignore

user = Blueprint('user', __name__)

@user.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    login = data.get('login')
    password = data.get('password')

    # Exemple simple, à remplacer par une vraie vérif
    if login == "admin" and password == "1234":
        return jsonify({"message": "Connexion réussie", "user_id": 1}), 200
    else:
        return jsonify({"message": "Identifiants incorrects"}), 401


recognizer = sr.Recognizer()
engine = pyttsx3.init()

client = InferenceClient(
    model= os.environ.get("HF_MODEL") ,
    token= os.environ.get("HF_TOKEN") ,
)

def speak(text):
    def run():
        engine.say(text)
        engine.runAndWait()
    threading.Thread(target=run).start()

@user.route('/assistant', methods=['POST'])
def assistant():
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        try:
            audio = recognizer.listen(source)
            commande = recognizer.recognize_google(audio, language="fr-FR")
            print(f"Commande vocale : {commande}")

            response = client.text_generation(prompt=commande, max_new_tokens=200)
            speak(response)
            return jsonify({"status": "success", "question": commande, "response": response}), 200

        except sr.UnknownValueError:
            return jsonify({"status": "error", "message": "Je n'ai pas compris."}), 400
        except sr.RequestError:
            return jsonify({"status": "error", "message": "Erreur de connexion à Google Speech."}), 500