from mysql.connector import connect


class DataBase:
    
    con = None
    
    @staticmethod
    def get_connection():
        
        try :
            if DataBase.con == None :  # noqa: E711
                DataBase.con = connect(
                user='root',
                password='',
                host='localhost',
                port=3306,
                database='pfa'
                )
            print("Connection Ok ")
            return DataBase.con
        except :  # noqa: E722
            print("Connection Error ")
            return None