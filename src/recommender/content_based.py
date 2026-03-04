import json
from pathlib import Path
from typing import List, Dict, Optional
from src.processors.unified_schema import MediaItem
from .feature_extractor import FeatureExtractor
from .similarity import SimilarityCalculator

class ContentBasedRecommender:
    """Main recommendation engine"""
    
    def __init__(self, database_path: str = 'data/processed/media_database.json'):
        self.database_path = Path(database_path)
        self.items: List[MediaItem] = []
        self.item_index: Dict[str, int] = {}  # Map item ID to index
        self.features = None
        self.feature_extractor = FeatureExtractor()
        
        self._load_database()
        self._build_features()
    
    def _load_database(self):
        """Load media database from JSON file"""
        with open(self.database_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.items = [MediaItem.from_dict(item) for item in data]
        
        for idx, item in enumerate(self.items):
            self.item_index[item.id] = idx
        
        print(f"Loaded {len(self.items)} items from database")
    

    def _build_features(self):
        print("Building feature vectors...")
        self.features = self.feature_extractor.fit_transform(self.items)
        print(f"Feature matrix shape: {self.features.shape}")
    

    def find_by_title(self, title: str, media_type: Optional[str] = None) -> List[MediaItem]:

        title_lower = title.lower()
        results = []
        
        for item in self.items:
            if title_lower in item.title.lower():
                if media_type is None or item.media_type == media_type:
                    results.append(item)
        
        return results
    

    def recommend_similar(self, item_id: str, top_k: int = 10) -> List[Dict]:

        if item_id not in self.item_index:
            raise ValueError(f"Item {item_id} not found in database")
        
        item_idx = self.item_index[item_id]
        
        # calculate similarity
        similar_items = SimilarityCalculator.cosine(self.features, item_idx, top_k)
        
        recommendations = []
        for idx, score in similar_items:
            item = self.items[idx]
            recommendations.append({
                'item': item,
                'similarity_score': round(score, 3),
                'title': item.title,
                'type': item.media_type,
                'genres': item.genres,
                'rating': item.rating
            })
        
        return recommendations