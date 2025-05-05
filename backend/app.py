# app.py
from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from flask_cors import CORS
from controller.controller_user import user
#from controller.controller_model import prediction_bp

app = Flask(__name__)

CORS(app)  # Autorise les requêtes depuis React Native
app.register_blueprint(user, url_prefix='/api')
#app.register_blueprint(prediction_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)