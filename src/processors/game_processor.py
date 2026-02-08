from .unified_schema import MediaItem

class GameProcessor:
    """Convert RAWG API data to unified format"""

    @staticmethod
    def process_game(raw_data: dict) -> MediaItem:
        rating = raw_data.get('rating')
        if rating:
            rating = rating * 2  # RAWG uses 0-5 rating scale, convert to 0-10
        
        # Extract year from release date
        year = None
        if raw_data.get('released'):
            year = int(raw_data['released'][:4])
        
        return MediaItem(
            id=f"game_{raw_data['id']}",
            title=raw_data.get('name', 'Unknown'),
            media_type='game',
            genres=[g['name'] for g in raw_data.get('genres', [])],
            tags=[t['name'] for t in raw_data.get('tags', [])[:10]],  # Limit to 10 tags
            description=raw_data.get('description_raw', '') or raw_data.get('description', ''),
            year=year,
            rating=rating,
            metadata={
                'platforms': [p['platform']['name'] for p in raw_data.get('platforms', [])],
                'developers': [d['name'] for d in raw_data.get('developers', [])],
                'publishers': [p['name'] for p in raw_data.get('publishers', [])],
                'esrb_rating': raw_data.get('esrb_rating', {}).get('name') if raw_data.get('esrb_rating') else None,
                'metacritic': raw_data.get('metacritic')
            }
        )