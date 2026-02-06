from .base_collector import BaseCollector
from config.settings import JIKAN_BASE_URL, RATE_LIMITS

class AnimeCollector(BaseCollector):
    """Collector for anime, manga, light novel etc. via Jikan API"""
    def __init__(self):
        super().__init__(name = 'jikan', base_url = JIKAN_BASE_URL, rate_limit = RATE_LIMITS['jikan'])

    def search(self, query, media_type = 'anime', limit=10):
        """
        Search for anime or manga
        Args:
            query: Search term
            media_type: 'anime' or 'manga'
            limit: Max number of results
        Returns: 
            List of results
        """
        data = self.fetch(
            endpoint = media_type, 
            params = {'q': query, 'limit': limit}, 
            cache_key = f"search_{media_type}_{query}"
        )

        if data and 'data' in data:
            return data['data']
        return []
    
    def get_details(self, item_id, media_type = 'anime'):
        """
        Get info about anime/manga
        Args:
            item_id: MyAnimeList ID
            media_type: 'anime' or 'manga'
        Returns:
            Detailed item data or None
        """
        data = self.fetch(
            endpoint=f"{media_type}/{item_id}/full", 
            cache_key=f"details_{media_type}_{item_id}"
        )
        
        if data and 'data' in data:
            return data['data']
        return None