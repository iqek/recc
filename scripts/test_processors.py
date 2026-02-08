import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.collectors.anime_collector import AnimeCollector
from src.collectors.game_collector import GameCollector
from src.collectors.movie_collector import MovieCollector
from src.collectors.book_collector import BookCollector

from src.processors.anime_processor import AnimeProcessor
from src.processors.game_processor import GameProcessor
from src.processors.movie_processor import MovieProcessor
from src.processors.book_processor import BookProcessor

print("Testing processors...\n")

# Test Anime Processor
print(" ANIME")
anime_col = AnimeCollector()
anime_data = anime_col.get_details(1, 'anime')
if anime_data:
    anime_item = AnimeProcessor.process_anime(anime_data)
    print(f"Title: {anime_item.title}")
    print(f"Type: {anime_item.media_type}")
    print(f"Genres: {anime_item.genres}")
    print(f"Rating: {anime_item.rating}")
    print(f"ID: {anime_item.id}")

# Test Game Processor
print("\n GAME ")
game_col = GameCollector()
game_results = game_col.search('witcher 3', limit=1)
if game_results:
    game_data = game_col.get_details(game_results[0]['id'])
    if game_data:
        game_item = GameProcessor.process_game(game_data)
        print(f"Title: {game_item.title}")
        print(f"Type: {game_item.media_type}")
        print(f"Genres: {game_item.genres}")
        print(f"Rating: {game_item.rating}")
        print(f"ID: {game_item.id}")

# Test Movie Processor
print("\n MOVIE")
movie_col = MovieCollector()
movie_results = movie_col.search('inception', limit=1)
if movie_results:
    movie_data = movie_col.get_details(movie_results[0]['id'], 'movie')
    if movie_data:
        movie_item = MovieProcessor.process_movie(movie_data)
        print(f"Title: {movie_item.title}")
        print(f"Type: {movie_item.media_type}")
        print(f"Genres: {movie_item.genres}")
        print(f"Rating: {movie_item.rating}")
        print(f"ID: {movie_item.id}")

# Test Book Processor
print("\n BOOK ")
book_col = BookCollector()
book_results = book_col.search('dune frank herbert', limit=1)
if book_results:
    book_item = BookProcessor.process_book(book_results[0])
    print(f"Title: {book_item.title}")
    print(f"Type: {book_item.media_type}")
    print(f"Genres: {book_item.genres}")
    print(f"Rating: {book_item.rating}")
    print(f"ID: {book_item.id}")

print("\n✅ All processors working!")