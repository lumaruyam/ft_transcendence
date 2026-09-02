-- Owner: Track 1 (Foundation, Auth, and API infrastructure)
-- Responsible for: initial schema baseline, hand-maintained to describe intent alongside backend/prisma/schema.prisma
-- (the actual source of truth going forward).
--
-- Prisma migrate workflow note: once the team runs `npx prisma migrate dev --name init` against schema.prisma,
-- Prisma generates its own timestamped SQL migration files under backend/prisma/migrations/ and this hand-written
-- file is superseded — keep it only as a readable scaffold sketch until that first `prisma migrate dev` run,
-- then either delete it or keep it as a historical reference (do not hand-edit it after Prisma migrations exist).

-- ── users ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
	id				TEXT PRIMARY KEY,
	email			TEXT NOT NULL,
	password_hash	TEXT NOT NULL,
	password_salt	TEXT NOT NULL,
	name			TEXT NOT NULL,
	avatar			TEXT,
	oauth_provider	TEXT,
	oauth_id		TEXT,
	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX user_email_key ON users (email);

-- ── projects ────────────────────────────────────────────────────────────────────────────────
CREATE TABLE projects (
	id				TEXT PRIMARY KEY,
	name			TEXT NOT NULL,
	owner_id		TEXT NOT NULL,
	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT projects_owner_id_fkey
		FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX projects_owner_id_idx ON projects (owner_id);

-- ── project_members ─────────────────────────────────────────────────────────────────────────
CREATE TABLE project_members (
	project_id		TEXT NOT NULL,
	user_id			TEXT NOT NULL,
	role			TEXT NOT NULL,
	PRIMARY KEY (project_id, user_id),
	CONSTRAINT project_members_project_id_fkey
		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT project_members_user_id_key
		FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX project_members_user_id_idx ON project_members

-- ── project_invites ─────────────────────────────────────────────────────────────────────────
CREATE TABLE project_invites (
	id				TEXT PRIMARY KEY,
	project_id		TEXT NOT NULL,
	token_hash		TEXT NOT NULL,
	role			TEXT NOT NULL,
	max_uses		INTEGER,
	use_count		INTEGER NOT NULL DEFAULT 0,
	expires_at		TIMESTAMP(3),
	created_by		TEXT NOT NULL,
	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	revoked_by		TEXT,
	revoked_at		TIMESTAMP(3),
	CONSTRAINT project_invites_project_id_fkey
		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT project_invites_created_by_fkey
		FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT project_invites_revoked_by_fkey
		FOREIGN KEY (revoked_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX project_invites_token_hash_key ON project_invites (token_hash);
CREATE INDEX project_invites_project_id_idx ON project_invites (project_id);
CREATE INDEX project_invites_created_by_idx ON project_invites (created_by);
CREATE INDEX project_invites_revoked_by_idx ON project_invites (revoked_by);

-- ── boards ──────────────────────────────────────────────────────────────────────────────────
CREATE TABLE boards (
	id				TEXT PRIMARY KEY,
	project_id		TEXT NOT NULL,
	title			TEXT NOT NULL,
	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT boards_project_id_fkey
		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX boards_project_id_idx ON boards (project_id);

-- ── lists ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE lists (
	id				TEXT PRIMARY KEY,
	board_id		TEXT NOT NULL,
	title			TEXT NOT NULL,
	position		INTEGER NOT NULL,
	CONSTRAINT ists_board_id_fkey
		FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX lists_board_id_idx ON lists (board_id);

-- ── cards ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE cards (
	id				TEXT PRIMARY KEY,
	list_id			TEXT NOT NULL,
	title			TEXT NOT NULL,
	description		TEXT,
	linked_branch	TEXT,
	linked_pr_url	TEXT,
	status			TEXT NOT NULL DEFAULT 'todo',
	position		INTEGER NOT NULL,
	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT cards_list_id_fkey
		FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX cards_list_id_idx ON cards (list_id);

-- ── tags ────────────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE tags (
-- 	id				TEXT PRIMARY KEY,
-- 	project_id		TEXT NOT NULL,
-- 	name			TEXT NOT NULL,
-- 	color			TEXT,
-- 	created_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
-- 	CONSTRAINT tags_project_id_fkey
-- 		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
-- );
-- CREATE UNIQUE INDEX tags_project_id_name_key ON tags (project_id, name);

-- ── card_tags ───────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE card_tags (
-- 	card_id  TEXT NOT NULL,
-- 	tag_id   TEXT NOT NULL,
-- 	PRIMARY KEY (card_id, tag_id),
-- 	CONSTRAINT card_tags_card_id_fkey
-- 		FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE ON UPDATE CASCADE,
-- 	CONSTRAINT card_tags_tag_id_fkey
-- 		FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE ON UPDATE CASCADE
-- );
-- CREATE INDEX card_tags_tag_id_idx ON card_tags (tag_id);

-- ── notes ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE notes (
	id				TEXT PRIMARY KEY,
	project_id		TEXT NOT NULL,
	content_json 	JSONB NOT NULL,
	updated_by		TEXT NOT NULL,
	updated_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT notes_project_id_fkey
		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT notes_updated_by_fkey
		FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX notes_project_id_idx ON notes (project_id);
CREATE INDEX notes_updated_by_idx ON notes (updated_by);

-- ── attachments ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attachments (
	id				TEXT PRIMARY KEY,
	project_id		TEXT NOT NULL,
	card_id			TEXT,
	file_url		TEXT NOT NULL,
	file_type		TEXT NOT NULL,
	uploaded_by		TEXT NOT NULL,
	uploaded_at		TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT attachments_project_id_fkey
		FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT attachments_card_id_fkey
		FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE SET NULL ON UPDATE CASCADE,
	CONSTRAINT attachments_uploaded_by_fkey
		FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX attachments_project_id_idx ON attachments (project_id);
CREATE INDEX attachments_card_id_idx ON attachments (card_id);
CREATE INDEX attachments_uploaded_by_idx ON attachments (uploaded_by);

-- ── git_links ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE git_links (
	card_id.     TEXT PRIMARY KEY,
	repo_url     TEXT NOT NULL,
	branch_name  TEXT NOT NULL,
	pr_status    TEXT NOT NULL,
	CONSTRAINT git_links_card_id_fkey
		FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── attachments ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (

)


-- TODO: CREATE TABLE notifications (id, user_id, type, payload, read_at, created_at)
-- TODO: CREATE TABLE webhook_events (id, provider, repo, event_type, payload, processed_at, created_at)
-- TODO: CREATE TABLE api_keys (id, project_id nullable, user_id nullable, key_hash, rate_limit, created_at)
-- TODO: add foreign key constraints and indexes matching docs/db-schema.md and backend/prisma/schema.prisma
