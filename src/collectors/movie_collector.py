from .base_collector import BaseCollector
from config.settings import TMDB_BASE_URL, TMDB_API_KEY, RATE_LIMITS

class MovieCollector(BaseCollector):
    """Collector for movies/tv shows. via TMDB API"""
    def __init__(self):
        super().__init__(name = 'tmdb', base_url = TMDB_BASE_URL, rate_limit = RATE_LIMITS['tmdb'])
        self.api_key = TMDB_API_KEY

    def search(self, query, media_type = 'movie', limit = 10):
        """
        Search for movies and tv shows
        Args:
            query: Search term
            media_type: 'movie' or 'tv'
            limit: Max number of results
        Returns: 
            List of results
        """
        data = self.fetch(
            endpoint = f"search/{media_type}",
            params = {'api_key': self.api_key, 'query': query},
            cache_key = f"serch_{media_type}_{query}"
        )

        if data and 'results' in data:
            return data['results'][:limit]
        return []
    
    def get_details(self, item_id, media_type):
        """
        Get info about movie/tv show
        Args:
            item_id: TMDB ID
            media_type: 'movie' or 'tv'
        Returns:
            Detailed item data or None
        """
        data = self.fetch(
            endpoint = f"{media_type}/{item_id}",
            params = {'api_key': self.api_key, 'append_to_response': 'keywords, credits'},
            cache_key=f"details_{media_type}_{item_id}"
        )
        
        return data
