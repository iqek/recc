from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Tuple

class SimilarityCalculator:
    def cosine(features, item_idx: int, top_k: int = 10) -> List[Tuple[int, float]]:
        target_vector = features[item_idx]. reshape(1, -1)

        similarities = cosine_similarity(target_vector, features)[0]

        sorted_indices = similarities.argsort()[::-1]

        results = []
        for idx in sorted_indices:
            if idx != item_idx and len(results) < top_k:
                results.append((int(idx), float(similarities[idx])))

        return results