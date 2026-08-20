import { Router } from 'express';
import { assertValidSource, SOURCES } from '../services/sources.js';
import { getRecommendations } from '../recommender/engine.js';
import { getListIdsForItem, toApiItem } from '../repo.js';

export const recommendationsRouter = Router();

recommendationsRouter.get('/', async (req, res, next) => {
  try {
    const requested = req.query.source ? [String(req.query.source)] : SOURCES;
    requested.forEach(assertValidSource);

    const results = await Promise.all(requested.map((source) => getRecommendations(source)));

    const bySource = {};
    for (const result of results) {
      bySource[result.source] = {
        fallback: result.fallback,
        message: result.message,
        items: await Promise.all(
          result.items.map(async ({ item, score, because, matchedFavorite }) => ({
            ...toApiItem(item, { listIds: await getListIdsForItem(item.id) }),
            score,
            because,
            becauseOf: matchedFavorite,
          }))
        ),
      };
    }
    res.json(bySource);
  } catch (err) {
    next(err);
  }
});
