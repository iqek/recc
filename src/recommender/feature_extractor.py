import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer
from typing import List

class FeatureExtractor:
    """extract and vectorize features"""
    
    def __init__(self):
        # for text
        self.tfidf = TfidfVectorizer(
            max_features=100,     
            stop_words='english',  # removes common words 
            ngram_range=(1, 2)     
        )
        
        self.genre_encoder = MultiLabelBinarizer()

        self.tag_encoder = MultiLabelBinarizer()
        
        self.is_fitted = False
    
    def fit(self, items):
        """learn vocabulary from all items"""

        texts = [item.get_text_for_similarity() for item in items]
        self.tfidf.fit(texts)

        genres = [item.genres for item in items]
        self.genre_encoder.fit(genres)
        
        tags = [item.tags for item in items]
        self.tag_encoder.fit(tags)
        
        self.is_fitted = True
    
    def transform(self, items):
        """convert items to vectors"""
        if not self.is_fitted:
            raise ValueError("mus call fit first")
        
        # text to numbers
        texts = [item.get_text_for_similarity() for item in items]
        text_features = self.tfidf.transform(texts).toarray()
        
        genres = [item.genres for item in items]
        genre_features = self.genre_encoder.transform(genres)

        tags = [item.tags for item in items]
        tag_features = self.tag_encoder.transform(tags)
        
        # Combine all features
        combined = np.hstack([
            text_features * 2.0,  
            genre_features * 1.5,
            tag_features * 1.0 
        ])
        
        return combined
    
    def fit_transform(self, items):
        """fit and transform"""
        self.fit(items)
        return self.transform(items)