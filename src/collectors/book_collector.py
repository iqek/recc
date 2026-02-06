from .base_collector import BaseCollector
from config.settings import GOOGLE_BOOKS_BASE_URL, GOOGLE_BOOKS_API_KEY, RATE_LIMITS

class BookCollector(BaseCollector):
    """Collector for books. via Google Books API"""
    def __init__(self):
        super().__init__(name='google_books', base_url=GOOGLE_BOOKS_BASE_URL, rate_limit=RATE_LIMITS['google_books'])
        self.api_key = GOOGLE_BOOKS_API_KEY
    
    def search(self, query, limit=10):
        """
        Search for books
        Args:
            query: Search term
            limit: Max number of results
        Returns:
            List of results
        """
        params = {
            'q': query,
            'maxResults': min(limit, 40)  # API max is 40
        }
        
        if self.api_key:
            params['key'] = self.api_key
        
        data = self.fetch(
            endpoint='volumes',
            params=params,
            cache_key=f"search_{query}"
        )
        
        if data and 'items' in data:
            return data['items']
        return []
    
    def get_details(self, volume_id):
        """
        Get detailed info about book
        Args:
            volume_id: Google Books volume ID
        Returns:
            Detailed item data or None
        """
        params = {}
        if self.api_key:
            params['key'] = self.api_key
        
        data = self.fetch(
            endpoint=f'volumes/{volume_id}',
            params=params,
            cache_key=f"details_{volume_id}"
        )
        
        return data