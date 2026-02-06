import requests
import json
import time
from pathlib import Path
from abc import ABC, abstractmethod

class BaseCollector(ABC):
    """Base class for all api collectors"""
    def __init__(self, name, base_url, rate_limit = 10):
        self.name = name
        self.base_url = base_url
        self.rate_limit = rate_limit

        self.last_req_time = 0

        #create cache directory, if it doesn't exist
        self.cache_dir = Path(f'data/raw/{name}')
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _wait_rate_limit(self):
        """Wait between requests"""
        time_since_last = time.time() - self.last_req_time
        wait_time = (1.0 / self.rate_limit) - time_since_last
        
        if wait_time > 0:
            time.sleep(wait_time)
        
        self.last_request_time = time.time()

    def _get_from_cache(self, cache_key):
        """Load data from cache file"""
        cache_file = self.cache_dir / f"{cache_key}.json"

        if cache_file.exists():
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
            
        return None

    def _save_to_cache(self, cache_key, data):
        """Save data to cache file"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def fetch(self, endpoint, params=None, cache_key=None):
        """Fetch data from API with caching"""

        #Generate cache key if not provided
        if cache_key is None:
            cache_key = f"{endpoint}_{str(params)}"
        
        #clean up
        cache_key = cache_key.replace('/', '_').replace(' ', '_').replace("'", "").replace("{", "").replace("}", "")
        
        #Check cache first
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached
        
        #If not in cache, make an API call
        self._wait_rate_limit()
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            #Save to cache
            self._save_to_cache(cache_key, data)
            
            return data
            
        except Exception as e:
            return None
    
    @abstractmethod
    def search(self, query, limit=10):
        """Search - different for each collector"""
        pass
    
    @abstractmethod
    def get_details(self, item_id):
        """Get details - different for each collector"""
        pass

