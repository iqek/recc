import { Router } from 'express';
import { assertValidSource, SOURCES } from '../services/sources.js';
import { getRecommendations } from '../recommender/engine.js';
import { getFavorites, getListIdsForItem, getUserEngagedItems, toApiItem } from '../repo.js';

export const recommendationsRouter = Router();

/** Shared by the global (favorites-based) and per-list recommendation routes. */
export async function buildRecommendationsResponse(userId, profileItems, requestedSources) {
  const engagedItems = await getUserEngagedItems(userId);
  const results = await Promise.all(
    requestedSources.map((source) => getRecommendations(profileItems, engagedItems, source))
  );

  const bySource = {};
  for (const result of results) {
    bySource[result.source] = {
      fallback: result.fallback,
      message: result.message,
      items: await Promise.all(
        result.items.map(async ({ item, score, because, matchedItem }) => ({
          ...toApiItem(item, { listIds: await getListIdsForItem(userId, item.id) }),
          score,
          because,
          becauseOf: matchedItem,
        }))
      ),
    };
  }
  return bySource;
}

recommendationsRouter.get('/', async (req, res, next) => {
  try {
    const requested = req.query.source ? [String(req.query.source)] : SOURCES;
    requested.forEach(assertValidSource);

    const favorites = await getFavorites(req.user.id);
    res.json(await buildRecommendationsResponse(req.user.id, favorites, requested));
  } catch (err) {
    next(err);
  }
});
