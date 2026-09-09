-- When a saved file was last opened, and how often.
--
-- Server-side and only for files someone already saved to their own workspace.
-- No new privacy surface: the server stores these files, serves them, and knows
-- who asked. Counting the ask adds nothing it did not already see.
--
-- Deliberately not a per-open event table. The question is "is the workspace
-- used or just filled", and two columns answer it without accumulating a log of
-- who read what and when — which is the kind of record that becomes a subpoena
-- target and helps nobody here.
ALTER TABLE files ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE files ADD COLUMN last_opened_at INTEGER;
