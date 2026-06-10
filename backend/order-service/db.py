import os
import pymysql
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "telkantin")

def get_db_connection(include_db=True):
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if include_db else None,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def init_db():
    # Ensure database exists
    try:
        conn = get_db_connection(include_db=False)
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.close()
    except Exception as e:
        print(f"Warning: Could not ensure database {DB_NAME} exists: {e}")

    # Ensure tables are initialized from order.sql
    try:
        conn = get_db_connection(include_db=True)
        with conn.cursor() as cursor:
            sql_path = os.path.join(os.path.dirname(__file__), "order.sql")
            if os.path.exists(sql_path):
                with open(sql_path, "r") as f:
                    sql_content = f.read()
                # Execute queries (split by semicolon if multiple, but here it's simple)
                # Since order.sql contains a single table creation, we can execute it directly
                queries = [q.strip() for q in sql_content.split(";") if q.strip()]
                for query in queries:
                    cursor.execute(query)
                print("Database table initialized successfully.")
            else:
                print("Warning: order.sql file not found.")
        conn.close()
    except Exception as e:
        print(f"Error initializing database table: {e}")
