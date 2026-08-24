-- Cached catalog entries pulled from external APIs.
CREATE TABLE IF NOT EXISTS items (
  id            SERIAL PRIMARY KEY,
  source        TEXT NOT NULL CHECK (source IN ('anime', 'manga', 'movie', 'game', 'book', 'visual_novel')),
  external_id   TEXT NOT NULL,
  title         TEXT NOT NULL,
  image_url     TEXT,
  description   TEXT,
  creator       TEXT,
  year          INTEGER,
  rating        REAL,
  popularity    INTEGER,
  url           TEXT,
  raw_json      JSONB,
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

-- CREATE TABLE IF NOT EXISTS above won't add columns to an already-existing table, so:
ALTER TABLE items ADD COLUMN IF NOT EXISTS popularity INTEGER;

-- Genres/themes/creators, used to build the recommender's tag vectors.
CREATE TABLE IF NOT EXISTS item_tags (
  item_id   INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag       TEXT NOT NULL,
  tag_type  TEXT NOT NULL CHECK (tag_type IN ('genre', 'theme', 'creator')),
  PRIMARY KEY (item_id, tag, tag_type)
);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags(tag);

-- Favorite/rating state for an item. Independent of which list(s) it's in.
CREATE TABLE IF NOT EXISTS user_items (
  item_id       INTEGER PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  user_rating   INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  favorited_at  TIMESTAMPTZ
);

-- User-created lists. Not tied to a media type - can mix anime, books, etc.
CREATE TABLE IF NOT EXISTS lists (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS list_items (
  list_id   INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  item_id   INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
