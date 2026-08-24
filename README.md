# recc.

An enhanced website version of a previous project. Recommends anime, manga, movies, games, books, and visual novels based on your favorites and lists, using tag similarity.

**Tech stack:** Node.js, Express, PostgreSQL, vanilla JS/HTML/CSS, Docker + Kubernetes. Data from AniList, TMDB, RAWG, Google Books, and VNDB.

**Features:** search across 6 media types, mixed-media custom lists, favorites, recommendations (global and per-list), multi-user accounts.

**Setup:** `docker compose up -d && npm install && cp .env.example .env && npm start`
