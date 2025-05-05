# services/mistral_service.py
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv  # Ajoutez ceci
import os

load_dotenv()  # Charge les variables du .env

class MistralService:
    def __init__(self):
        # Utilisez le NOM de la variable, pas sa valeur
        hf_token = os.getenv("HUGGINGFACE_TOKEN")  # ✅

        self.model = AutoModelForCausalLM.from_pretrained(
            "mistralai/Mistral-7B-Instruct-v0.3",
            token=hf_token
        )
        self.tokenizer = AutoTokenizer.from_pretrained(
            "mistralai/Mistral-7B-Instruct-v0.3",
            token=hf_token
        )