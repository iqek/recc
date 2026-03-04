import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.recommender.content_based import ContentBasedRecommender

# Initialize recommender
print("Initializing recommender...\n")
rec = ContentBasedRecommender()

# Test 1: Search for an item
print("=== SEARCH TEST ===")
results = rec.find_by_title('cowboy')
for item in results:
    print(f"{item.title} ({item.media_type}) - ID: {item.id}")

# Test 2: Get recommendations for single item
print("\n=== SINGLE ITEM RECOMMENDATIONS ===")
if results:
    item_id = results[0].id
    print(f"Based on: {results[0].title}\n")
    
    recs = rec.recommend_similar(item_id, top_k=10)
    
    for i, rec in enumerate(recs, 1):
        print(f"{i}. {rec['title']} ({rec['type']})")
        print(f"   Similarity: {rec['similarity_score']}")
        print(f"   Genres: {', '.join(rec['genres'][:3])}")
        print()