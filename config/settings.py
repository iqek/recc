import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys (will be empty until we add them)
RAWG_API_KEY = os.getenv('RAWG_API_KEY', 'efd4cb4ce2664817b5b5c74ab7fea75a')
TMDB_API_KEY = os.getenv('TMDB_API_KEY', 'ad26bdddff52bb765081588444b32bc9')
GOOGLE_BOOKS_API_KEY = os.getenv('GOOGLE_BOOKS_API_KEY', 'AIzaSyByt0VeFjJWcdEGBTvP-Ufe03tiQqRAiEU')

# API Base URLs
JIKAN_BASE_URL = 'https://api.jikan.moe/v4'
RAWG_BASE_URL = 'https://api.rawg.io/api'
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1'

# Cache settings
CACHE_DIR = 'data/raw'
CACHE_EXPIRY_DAYS = 7

# Rate limiting (requests per second)
RATE_LIMITS = {
    'jikan': 3, 
    'rawg': 10,
    'tmdb': 10,
    'google_books': 10
}