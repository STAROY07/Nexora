import os
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Config:
    """Application configuration settings."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'nexora_default_dev_secret_key_2026')
    
    # MySQL Database credentials
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'Aditiya@123')
    DB_NAME = os.getenv('DB_NAME', 'nexora')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    
    # Server settings
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', '1') == '1'
