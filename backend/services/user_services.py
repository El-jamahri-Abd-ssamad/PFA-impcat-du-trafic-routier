import os
import sys

# Ajouter le répertoire racine du projet (flask_courses) à sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.DAO.user_dao import UserDao, User

class UserManager:
    def __init__(self):
        self.userDao = UserDao()

    def auth(self, login: str, password: str) -> User | None:
        print(f'{login}, {password}')
        return self.userDao.auth(login, password)
    
    def adduser(self,username: str, login: str, password: str) :
        return self.userDao.adduser(username,login,password)