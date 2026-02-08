from .unified_schema import MediaItem

class AnimeProcessor:
    """Convert Jikan API data to unified format"""

    @staticmethod
    def process_anime(raw_data: dict) -> MediaItem:
        """Convert anime data to MediaItem"""
        return MediaItem(
            id= f"anime_{raw_data['mal_id']}",
            title= raw_data.get('title', 'Unknown'),
            media_type= 'anime',
            genres= [g['name'] for g in raw_data.get('genres', [])],
            tags= [t['name'] for t in raw_data.get('themes', [])],
            description= raw_data.get('synopsis', ''),
            year= raw_data.get('year'),
            rating= raw_data.get('score'),
            metadata={
                'episodes': raw_data.get('episodes'),
                'status': raw_data.get('status'),
                'studios': [s['name'] for s in raw_data.get('studios', [])],
                'type': raw_data.get('type')  # tv, movie, OVA, etc.
            }
    )

    @staticmethod
    def process_manga(raw_data: dict) -> MediaItem:
        """Convert manga/manhwa/light novel data to MediaItem"""
        # Get year from published date
        year = None
        if raw_data.get('published') and raw_data['published'].get('from'):
            year_str = raw_data['published']['from'][:4]
            year = int(year_str) if year_str.isdigit() else None
        
        return MediaItem(
            id=f"manga_{raw_data['mal_id']}",
            title=raw_data.get('title', 'Unknown'),
            media_type='manga',
            genres=[g['name'] for g in raw_data.get('genres', [])],
            tags=[t['name'] for t in raw_data.get('themes', [])],
            description=raw_data.get('synopsis', ''),
            year=year,
            rating=raw_data.get('score'),
            metadata={
                'chapters': raw_data.get('chapters'),
                'volumes': raw_data.get('volumes'),
                'status': raw_data.get('status'),
                'authors': [a['name'] for a in raw_data.get('authors', [])],
                'type': raw_data.get('type')  # Manga, Manhwa, Light Novel, etc.
            }
        )