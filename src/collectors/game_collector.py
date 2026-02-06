from .base_collector import BaseCollector
from config.settings import RAWG_BASE_URL, RAWG_API_KEY, RATE_LIMITS

class GameCollector(BaseCollector):
    """Collector for games. via RAWG API"""
    def __init__(self):
        super().__init__(name = 'rawg', base_url = RAWG_BASE_URL, rate_limit = RATE_LIMITS['rawg'])
        self.api_key = RAWG_API_KEY

    def search(self, query, limit=10):
        """
        Search for games
        Args:
            query: Search term
            limit: Max number of results
        Returns: 
            List of results
        """
        data = self.fetch(
            endpoint = 'games', 
            params = {'key': self.api_key, 'search': query, 'page_size': limit}, 
            cache_key=f"search_{query}"
        )

        if data and 'results' in data:
            return data['results']
        return []
    
    def get_details(self, item_id):
        """
        Get info about game
        Args:
            item_id: RAWG ID
        Returns:
            Detailed item data or None
        """
        data = self.fetch(
            endpoint = f"games/{item_id}",
            params = {'key': self.api_key},
            cache_key = f"details/games_{item_id}"
        )

        return data