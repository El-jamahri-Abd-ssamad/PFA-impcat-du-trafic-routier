import os
import sys

# Ajouter le répertoire racine du projet (flask_courses) à sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.models.user_model import User
    
from backend.DAO.connexion import DataBase
        
class UserDao:
    
    def __init__(self):
        self.con = DataBase.get_connection()
    
    def auth(self, login: str, password: str):
        query: str = "SELECT * FROM user WHERE email = %s AND password = %s;"  # Compiler une seule fois 
        if self.con is not None:  
            cursor = self.con.cursor(dictionary=True)
            try:
                cursor.execute(query, (login, password))
                results = cursor.fetchone()
                if results is not None:
                    return User(**results)
            except Exception as e:
                print(f"Error during authentication: {e}")
            finally:
                cursor.close()
        return None
    
if __name__ == "__main__":
    
    #DataBase.get_connection()
    userDao : UserDao = UserDao()
    print(userDao.auth('salma@esisa.ac.ma','1234'))
    #print(userDao.listUsers())