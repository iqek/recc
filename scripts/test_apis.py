import sys
from pathlib import Path

#add project root to python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import requests
from config.settings import *

def test_jikan():
    """Test Jikan API"""
    print("Testing Jikan API (anime/manga)...")
    response = requests.get(f'{JIKAN_BASE_URL}/anime?q=bakemonogatari&limit=1')
    print(f"  Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('data'):
            print(f"  Found: {data['data'][0]['title']}")
            return True
    print("  Failed")
    return False

def test_rawg():
    """Test RAWG API"""
    print("\nTesting RAWG API (games)...")
    
    if not RAWG_API_KEY:
        print("   No API key in .env file")
        return None
    
    response = requests.get(
        f'{RAWG_BASE_URL}/games',
        params={'key': RAWG_API_KEY, 'search': 'danganronpa trigger', 'page_size': 1}
    )
    print(f"  Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('results'):
            print(f"  Found: {data['results'][0]['name']}")
            return True
    print("  Failed")
    return False

def test_tmdb():
    """Test TMDB API"""
    print("\nTesting TMDB API (movies/TV)...")
    
    if not TMDB_API_KEY:
        print("   No API key in .env file")
        return None
    
    response = requests.get(
        f'{TMDB_BASE_URL}/search/movie',
        params={'api_key': TMDB_API_KEY, 'query': 'inception'}
    )
    print(f"  Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('results'):
            print(f"  Found: {data['results'][0]['title']}")
            return True
    print("  Failed")
    return False

def test_google_books():
    """Test Google Books API"""
    print("\nTesting Google Books API...")
    
    params = {'q': 'dune frank herbert'}
    if GOOGLE_BOOKS_API_KEY:
        params['key'] = GOOGLE_BOOKS_API_KEY
    
    response = requests.get(f'{GOOGLE_BOOKS_BASE_URL}/volumes', params=params)
    print(f"  Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('items'):
            print(f"  Found: {data['items'][0]['volumeInfo']['title']}")
            return True
    print("  Failed")
    return False

if __name__ == '__main__':
    
    results = {
        '\nJikan (Anime/Manga)': test_jikan(),
        'RAWG (Games)': test_rawg(),
        'TMDB (Movies/TV)': test_tmdb(),
        'Google Books': test_google_books()
    }
    
    for api, result in results.items():
        if result is True:
            print(f" {api}: Working")
        elif result is None:
            print(f" {api}: No API key configured")
        else:
            print(f" {api}: Failed")