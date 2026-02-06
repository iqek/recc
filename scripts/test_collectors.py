import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.collectors.anime_collector import AnimeCollector
from src.collectors.game_collector import GameCollector
from src.collectors.movie_collector import MovieCollector
from src.collectors.book_collector import BookCollector

print("Testing all collectors...\n")

# Anime
anime_col = AnimeCollector()
anime_results = anime_col.search('steins gate', limit=2)
print(f" anime: found {len(anime_results)} results")

# Games
game_col = GameCollector()
game_results = game_col.search('it takes', limit=2)
print(f" games: found {len(game_results)} results")

# Movies
movie_col = MovieCollector()
movie_results = movie_col.search('amelie', limit=2)
print(f" movies: found {len(movie_results)} results")

# Books
book_col = BookCollector()
book_results = book_col.search('1984', limit=2)
print(f" books: found {len(book_results)} results")

print("\n All collectors working!")