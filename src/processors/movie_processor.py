from .unified_schema import MediaItem

class MovieProcessor:
    """Convert TMDB API data to unified format"""
    
    @staticmethod
    def process_movie(raw_data: dict) -> MediaItem:
        # Extract year from release date
        year = None
        if raw_data.get('release_date'):
            year = int(raw_data['release_date'][:4])
        
        # Extract keywords if available
        keywords = []
        if 'keywords' in raw_data and 'keywords' in raw_data['keywords']:
            keywords = [k['name'] for k in raw_data['keywords']['keywords'][:10]]
        
        return MediaItem(
            id=f"movie_{raw_data['id']}",
            title=raw_data.get('title', 'Unknown'),
            media_type='movie',
            genres=[g['name'] for g in raw_data.get('genres', [])],
            tags=keywords,
            description=raw_data.get('overview', ''),
            year=year,
            rating=raw_data.get('vote_average'),
            metadata={
                'runtime': raw_data.get('runtime'),
                'budget': raw_data.get('budget'),
                'revenue': raw_data.get('revenue'),
                'production_companies': [c['name'] for c in raw_data.get('production_companies', [])]
            }
        )
    
    @staticmethod
    def process_tv(raw_data: dict) -> MediaItem:
        # Extract year from first air date
        year = None
        if raw_data.get('first_air_date'):
            year = int(raw_data['first_air_date'][:4])
        
        # Extract keywords if available
        keywords = []
        if 'keywords' in raw_data and 'results' in raw_data['keywords']:
            keywords = [k['name'] for k in raw_data['keywords']['results'][:10]]
        
        return MediaItem(
            id=f"tv_{raw_data['id']}",
            title=raw_data.get('name', 'Unknown'),
            media_type='tv',
            genres=[g['name'] for g in raw_data.get('genres', [])],
            tags=keywords,
            description=raw_data.get('overview', ''),
            year=year,
            rating=raw_data.get('vote_average'),
            metadata={
                'number_of_seasons': raw_data.get('number_of_seasons'),
                'number_of_episodes': raw_data.get('number_of_episodes'),
                'status': raw_data.get('status'),
                'networks': [n['name'] for n in raw_data.get('networks', [])]
            }
        )