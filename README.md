# Cross-Media Recommendation System

A machine learning recommendation system that suggests similar content across anime, manga, games, movies, TV shows, and books.
*(built as a learning project)*

##### 🛠 Tech Stack
Python, scikit-learn, NumPy, pandas, requests  
**APIs:** Jikan, RAWG, TMDB, Google Books

## Features
- Multi-source data collection with caching
- Content-based filtering using TF-IDF and cosine similarity
- Cross-media recommendations (e.g., anime → similar games/movies)
- Feature extraction with weighted genre and tag encoding

## setup
```bash
# Clone and install
git clone https://github.com/yourusername/omni-rec.git
cd omni-rec
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Add your RAWG, TMDB, and Google Books API keys to .env

# Build database
python scripts/build_database.py

# Test recommender
python scripts/test_recommender.py
```

## usage
```python
from src.recommender.content_based import ContentBasedRecommender

# Initialize
rec = ContentBasedRecommender()

# Search for an item
items = rec.find_by_title('cowboy bebop')
print(items[0].title)  # "Cowboy Bebop"

# Get recommendations
recs = rec.recommend_similar(items[0].id, top_k=10)

for r in recs:
    print(f"{r['title']} ({r['type']}) - Score: {r['similarity_score']}")
```

**example output:**
```
Psycho-Pass (anime) - Score: 0.856
Mass Effect 2 (game) - Score: 0.654
Blade Runner 2049 (movie) - Score: 0.621
```

## Acknowledgments

- Jikan API (MyAnimeList data)
- RAWG (Game database)
- TMDB (Movie & TV data)
- Google Books API

---
