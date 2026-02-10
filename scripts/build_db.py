import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
import time

import json
from src.collectors.anime_collector import AnimeCollector
from src.collectors.game_collector import GameCollector
from src.collectors.movie_collector import MovieCollector
from src.collectors.book_collector import BookCollector

from src.processors.anime_processor import AnimeProcessor
from src.processors.game_processor import GameProcessor
from src.processors.movie_processor import MovieProcessor
from src.processors.book_processor import BookProcessor

def build_database():
    """Build initial media database"""
    
    database = []
    
    # Initialize collectors
    anime_col = AnimeCollector()
    game_col = GameCollector()
    movie_col = MovieCollector()
    book_col = BookCollector()
    
    #anime
    anime_titles = [
        'cowboy bebop', 'steins gate', 'fullmetal alchemist brotherhood',
        'death note', 'attack on titan', 'one punch man',
        'mob psycho 100', 'hunter x hunter', 'code geass',
        'psycho pass'
    ]
    
    print("Collecting anime...")
    for title in anime_titles:
        results = anime_col.search(title, media_type='anime', limit=1)
        if results:
            details = anime_col.get_details(results[0]['mal_id'], 'anime')
            if details:
                item = AnimeProcessor.process_anime(details)
                database.append(item.to_dict())
                print(f"   {item.title}")
    
    #games
    game_titles = [
        'catherine', 'elden ring', 'hollow knight',
        'split fiction', 'witcher 3', 'mass effect 2',
        'dark souls', 'crypt of the necrodancer', 'god of war',
        'hades'
    ]
    
    print("\nCollecting games...")
    for title in game_titles:
        results = game_col.search(title, limit=1)
        if results:
            details = game_col.get_details(results[0]['id'])
            if details:
                item = GameProcessor.process_game(details)
                database.append(item.to_dict())
                print(f"   {item.title}")
    
    #movies
    movie_titles = [
        'inception', 'interstellar', 'girl interrupted',
        'blade runner 2049', 'dark knight', 'barry lyndon',
        'the dreamers', 'arrival', 'in the mood for love',
        'paris, texas'
    ]
    
    print("\nCollecting movies...")
    for title in movie_titles:
        results = movie_col.search(title, media_type='movie', limit=1)
        if results:
            details = movie_col.get_details(results[0]['id'], 'movie')
            if details:
                item = MovieProcessor.process_movie(details)
                database.append(item.to_dict())
                print(f"   {item.title}")
    
    #books
    book_titles = [
        'dune frank herbert', '1984 george orwell', 'neuromancer',
        'foundation asimov', 'ender game', 'mistborn',
        'name of the wind', 'way of kings', 'project hail mary',
        'three body problem'
    ]
    
    print("\nCollecting books...")
    for title in book_titles:
        results = book_col.search(title, limit=1)
        if results:
            item = BookProcessor.process_book(results[0])
            database.append(item.to_dict())
            print(f"   {item.title}")
    
    # Save database
    db_path = Path('data/processed/media_database.json')
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
    
    print(f"\n Database built! {len(database)} items saved to {db_path}")
    
    # Print statistics
    types = {}
    for item in database:
        t = item['media_type']
        types[t] = types.get(t, 0) + 1
    
    print("\nDatabase stats:")
    for media_type, count in types.items():
        print(f"  {media_type}: {count}")

if __name__ == '__main__':
    build_database()