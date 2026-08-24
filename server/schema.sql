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

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Favorite/rating state for an item, per user. Independent of which list(s) it's in.
CREATE TABLE IF NOT EXISTS user_items (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id       INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  user_rating   INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  favorited_at  TIMESTAMPTZ,
  UNIQUE (user_id, item_id)
);

-- Upgrade path: older installs had item_id alone as the PK, with no user scoping at all.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_items_pkey' AND conrelid = 'user_items'::regclass)
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_items' AND column_name = 'id') THEN
    ALTER TABLE user_items DROP CONSTRAINT user_items_pkey;
    ALTER TABLE user_items ADD COLUMN id SERIAL PRIMARY KEY;
  END IF;
END $$;
ALTER TABLE user_items ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_items_user_id_item_id_key') THEN
    ALTER TABLE user_items ADD CONSTRAINT user_items_user_id_item_id_key UNIQUE (user_id, item_id);
  END IF;
END $$;

-- User-created lists. Not tied to a media type - can mix anime, books, etc.
CREATE TABLE IF NOT EXISTS lists (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade path: older installs had a single globally-unique list name, not per-user.
ALTER TABLE lists ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lists_name_key') THEN
    ALTER TABLE lists DROP CONSTRAINT lists_name_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lists_user_id_name_key') THEN
    ALTER TABLE lists ADD CONSTRAINT lists_user_id_name_key UNIQUE (user_id, name);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS list_items (
  list_id   INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  item_id   INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
CREATE INDEX IF NOT EXISTS idx_user_items_user ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_user ON lists(user_id);
