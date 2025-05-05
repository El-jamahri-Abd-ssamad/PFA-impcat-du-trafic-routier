import mysql.connector
from backend.models.user_model import User
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


def getConnection():
    conn = mysql.connector.connect(
        user='root',
        password='',
        host='localhost',
        database='PFA',
    )
    return conn

class UserDAO:
    @staticmethod
    def createUser(user: User) -> None:
        conn = getConnection()
        cursor = conn.cursor()
        query = "INSERT INTO User (email, password) VALUES (%s, %s)"
        cursor.execute(query, (user.email, user.password))
        conn.commit()
        conn.close()


    def auth(login: str, password: str) -> User | None:
        query = "SELECT email, password FROM user WHERE email = %s AND password = %s"
        con = getConnection()
        if con is not None:
            cursor = con.cursor()  
            cursor.execute(query, (login, password))
            results = cursor.fetchone()
            if results is not None:
                return User(email=results[0], password=results[1])
        return None
    
if __name__ == "__main__":
    user = User(email="salma@esisa.ac.ma", password="1234")
    UserDAO.createUser(user)
    print(f"Compte épargne créé: {user}")
    print(UserDAO.auth("ghita@esisa.ac.ma","1234"))