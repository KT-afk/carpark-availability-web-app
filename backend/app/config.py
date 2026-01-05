# backend/app/config.py
import os
import os
from dotenv import load_dotenv
from app.constants import MAX_CARPARKS_RETURN, REQUEST_TIMEOUT


# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = os.getenv('PORT', '5001')
    GOV_API_KEY = os.getenv('GOV_API_KEY')
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # External API settings
    GOV_API_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2'
    
    # Application settings
    MAX_CARPARKS_RETURN = MAX_CARPARKS_RETURN
    REQUEST_TIMEOUT = REQUEST_TIMEOUT