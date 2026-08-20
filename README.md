# recc.

A list-tracking and recommendation app for anime, manga, movies, games, books,
and visual novels. Make lists, mark favorites, get recommendations based on
what you like.

## Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Frontend:** plain HTML/CSS/JS
- **Data from:** Jikan (anime/manga), TMDB (movies), RAWG (games), Google Books, VNDB (visual novels)

## Setup

```bash
docker compose up -d      # starts Postgres
npm install
cp .env.example .env      # add your RAWG and TMDB keys
npm start
```

Open `http://localhost:3000`. The database tables are created automatically
on first run.

## How lists work

- **Favorites** is one global list that spans every media type.
- **Lists** are whatever you make — name them anything, mix any media type
  in each one.

## How recommendations work

No machine learning at this point. Every item gets tagged (genre/theme/creator), and your
favorites build a "taste profile" from those tags. New items are scored by
how closely they match that profile, then the results are diversified so you
don't just get ten near-identical picks. Each recommendation shows why it's
there — e.g. "because you liked *X*."

## API limits to know about

- **Jikan** (anime/manga): free, no key, but rate-limited and occasionally
  just down.
- **TMDB** (movies) and **RAWG** (games): each need a free API key.
- **Google Books**: works without a key, but a low daily limit — easy to
  hit if you're sharing an IP/network.
- **VNDB** (visual novels): free, no key — but not content-filtered, so
  adult titles can show up in results.
- **RAWG** is also not content-moderated.

All API calls happen server-side, so keys are never exposed to the browser.
Results get cached in Postgres so repeat lookups don't re-hit the API.

## Not built yet

- Dockerizing the app itself (right now only Postgres runs in Docker) and a
  Kubernetes setup
- User accounts
- Recommendations that also factor in other users' favorites