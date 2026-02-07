import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.processors.unified_schema import MediaItem

# Create a media item
anime = MediaItem(
    id="anime_1",
    title="Cowboy Bebop",
    media_type="anime",
    genres=["Action", "Sci-Fi"],
    tags=["Space", "Bounty Hunters"],
    description="A ragtag crew of bounty hunters travels across the galaxy.",
    year=1998,
    rating=8.9,
)

print(anime)
print("\n As Dictionary ")
print(anime.to_dict())
print("\n Text for Similarity ")
print(anime.get_text_for_similarity())

# Create from dict
data = {
    'id': 'game_3328',
    'title': 'The Witcher 3',
    'media_type': 'game',
    'genres': ['RPG', 'Action'],
}

game = MediaItem.from_dict(data)
print("\n From Dict ")
print(game)