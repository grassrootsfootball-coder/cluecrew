-- THE WRITE LOG WAS KEEPING LOCAL TIME WHILE EVERYTHING ELSE KEPT UTC.
--
-- `CURRENT_TIMESTAMP` is a timestamptz; storing it in a naive TIMESTAMP(3) column silently
-- converts it to the session's time zone. The session is BST, so every logged write landed one
-- hour ahead of the AttributionEvent recording the same act, and check:outside-writes matched none
-- of them. Its first real run reported 345 UNATTRIBUTED WRITES -- every one of them false, and
-- every one of them phrased as "a change nobody decided".
--
-- A boundary whose clock disagrees with the record it is compared against does not report
-- "unknown". It reports GUILT, confidently, about work that was fully attributed.

ALTER TABLE "ContentWriteLog" ALTER COLUMN "at" SET DEFAULT (now() AT TIME ZONE 'UTC');

CREATE OR REPLACE FUNCTION log_content_write() RETURNS TRIGGER AS $$
DECLARE
    changed TEXT[] := '{}';
    rec_id  TEXT;
    k       TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        FOR k IN SELECT key FROM jsonb_each(to_jsonb(NEW)) LOOP
            IF to_jsonb(NEW) -> k IS DISTINCT FROM to_jsonb(OLD) -> k THEN
                changed := array_append(changed, k);
            END IF;
        END LOOP;
        rec_id := to_jsonb(NEW) ->> 'id';
    ELSIF (TG_OP = 'DELETE') THEN
        rec_id := to_jsonb(OLD) ->> 'id';
    ELSE
        rec_id := to_jsonb(NEW) ->> 'id';
    END IF;

    INSERT INTO "ContentWriteLog"
        ("tableName", "recordId", "op", "changedColumns", "dbUser", "applicationName", "txId", "at")
    VALUES
        (TG_TABLE_NAME, COALESCE(rec_id, '(no id)'), TG_OP, changed,
         current_user, COALESCE(current_setting('application_name', TRUE), ''), txid_current()::TEXT,
         -- EXPLICIT, not left to the column default: the default is what was wrong, and a trigger
         -- that relies on it inherits whatever the next migration does to it.
         now() AT TIME ZONE 'UTC');

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- CORRECTING THE ROWS ALREADY WRITTEN. This is the one and only mutation of an append-only table,
-- and it is a CLOCK CORRECTION, not a prune: no row is added, removed, or changed in what it says
-- happened -- only in the convention it says it in. Every row predates this migration, so the
-- offset is uniform and the transformation is total.
UPDATE "ContentWriteLog"
   SET "at" = "at" - (SELECT (now() - (now() AT TIME ZONE 'UTC')));
