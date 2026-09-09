-- Workspace schema.
--
-- Everything here exists only for signed-in users. The anonymous viewer that
-- the site leads with touches none of it: it parses in the browser and never
-- calls the API at all. That separation is the product's main claim, so it is
-- worth stating at the top of the file that owns the other half.
--
-- Times are unix seconds (INTEGER) rather than SQLite datetimes: D1 has no
-- native date type, and integers compare and index without a parse step.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  -- Google's `sub` claim, not the email. Email addresses get reassigned and
  -- change; `sub` is the stable per-account identifier and is what the OIDC
  -- spec says to key on.
  google_sub    TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  name          TEXT,
  picture       TEXT,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users (email);

-- Sessions live server-side so that signing out actually revokes access, and
-- so a leaked cookie can be killed. A stateless JWT cannot do either.
CREATE TABLE sessions (
  -- SHA-256 of the token that was handed to the browser. Storing the hash
  -- means a dump of this table does not let anyone log in as anybody.
  token_hash    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  user_agent    TEXT
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expiry ON sessions (expires_at);

CREATE TABLE teams (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  -- Every user gets one personal team on first sign-in, so files and folders
  -- have exactly one owner type to belong to. Without it, "my files" and
  -- "team files" would be two storage paths and two permission rules.
  is_personal INTEGER NOT NULL DEFAULT 0,
  created_by  TEXT NOT NULL REFERENCES users (id),
  created_at  INTEGER NOT NULL
);

CREATE TABLE team_members (
  team_id   TEXT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON team_members (user_id);

CREATE TABLE invites (
  id          TEXT PRIMARY KEY,
  team_id     TEXT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('member', 'viewer')),
  -- Hashed for the same reason as sessions: the raw token only ever exists in
  -- the invite link.
  token_hash  TEXT NOT NULL UNIQUE,
  invited_by  TEXT NOT NULL REFERENCES users (id),
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  accepted_at INTEGER,
  accepted_by TEXT REFERENCES users (id)
);

CREATE INDEX idx_invites_team ON invites (team_id);
CREATE INDEX idx_invites_email ON invites (email);

CREATE TABLE folders (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  -- NULL parent means top level. Cascading delete removes the subtree, which
  -- is the behaviour a file manager implies; the API still deletes the R2
  -- objects explicitly, because a foreign key cannot reach object storage.
  parent_id  TEXT REFERENCES folders (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users (id),
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_folders_team_parent ON folders (team_id, parent_id);

CREATE TABLE files (
  id          TEXT PRIMARY KEY,
  team_id     TEXT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  folder_id   TEXT REFERENCES folders (id) ON DELETE CASCADE,
  r2_key      TEXT NOT NULL UNIQUE,
  file_name   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  sha256      TEXT NOT NULL,

  -- Envelope fields, parsed in the browser before upload and sent alongside
  -- the bytes so the list can be browsed, searched and sorted without pulling
  -- every file back down and re-parsing it.
  --
  -- This is a real privacy trade-off and the privacy policy has to say so:
  -- subjects and sender addresses sit in the database in plain text, where
  -- the file body does not. Storing them is what makes the list usable; the
  -- alternative is a list of opaque file names.
  source_format   TEXT,
  subject         TEXT,
  from_name       TEXT,
  from_address    TEXT,
  sent_at         INTEGER,
  has_attachments INTEGER NOT NULL DEFAULT 0,

  uploaded_by TEXT NOT NULL REFERENCES users (id),
  uploaded_at INTEGER NOT NULL
);

CREATE INDEX idx_files_team_folder ON files (team_id, folder_id);
CREATE INDEX idx_files_team_uploaded ON files (team_id, uploaded_at DESC);
-- Deduplicating an identical file re-saved into the same team is a lookup on
-- this pair, and it runs on every upload.
CREATE INDEX idx_files_team_sha ON files (team_id, sha256);
