from flask import Flask
from flask_cors import CORS
from controller.controller_user import user

app = Flask(__name__)
CORS(app)  # Autorise les requêtes depuis React Native
app.register_blueprint(user, url_prefix='/api')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
