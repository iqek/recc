// Serializes calls (min gap = minIntervalMs), retries once on 429/502/503/504 only if Retry-After says how long.
export function createQueue(minIntervalMs) {
  let chain = Promise.resolve();
  let lastRunAt = 0;

  function enqueue(task) {
    const run = async () => {
      const wait = Math.max(0, lastRunAt + minIntervalMs - Date.now());
      if (wait > 0) await sleep(wait);
      lastRunAt = Date.now();
      return task();
    };
    const result = chain.then(run, run);
    chain = result.catch(() => {});
    return result;
  }

  return { enqueue };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export async function fetchJsonWithRetry(url, options = {}, retries = 1) {
  const res = await fetch(url, options);
  const retryAfter = Number(res.headers.get('retry-after'));
  if (RETRYABLE_STATUSES.has(res.status) && retries > 0 && retryAfter > 0) {
    await sleep(retryAfter * 1000);
    return fetchJsonWithRetry(url, options, retries - 1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[httpQueue] ${url} -> ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
    const err = new Error(`Upstream API request failed (${res.status} ${res.statusText}). It may be down or rate-limiting us.`);
    err.status = 502;
    throw err;
  }
  return res.json();
}
