-- THE WRITE-BOUNDARY RECORD.
--
-- A TRIGGER, not a wrapper. Application code cannot opt out of a trigger, which is the entire
-- point: the fault being closed was a write nobody could account for, and a boundary that only
-- catches writes made through the boundary would not have caught it.

CREATE TABLE "ContentWriteLog" (
    "id"              BIGSERIAL    PRIMARY KEY,
    "tableName"       TEXT         NOT NULL,
    "recordId"        TEXT         NOT NULL,
    "op"              TEXT         NOT NULL,
    "changedColumns"  TEXT[]       NOT NULL DEFAULT '{}',
    "dbUser"          TEXT         NOT NULL,
    "applicationName" TEXT         NOT NULL,
    "txId"            TEXT         NOT NULL,
    "at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ContentWriteLog_tableName_recordId_idx" ON "ContentWriteLog"("tableName", "recordId");
CREATE INDEX "ContentWriteLog_at_idx" ON "ContentWriteLog"("at");

CREATE OR REPLACE FUNCTION log_content_write() RETURNS TRIGGER AS $$
DECLARE
    changed TEXT[] := '{}';
    rec_id  TEXT;
    k       TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- The columns whose value ACTUALLY changed. An UPDATE that rewrites a row to the same
        -- values is still recorded, with an empty list, because "something wrote here and changed
        -- nothing" is a different fact from "nothing wrote here" and both are worth being able
        -- to tell apart.
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
        ("tableName", "recordId", "op", "changedColumns", "dbUser", "applicationName", "txId")
    VALUES
        (TG_TABLE_NAME, COALESCE(rec_id, '(no id)'), TG_OP, changed,
         current_user, COALESCE(current_setting('application_name', TRUE), ''), txid_current()::TEXT);

    RETURN NULL; -- AFTER trigger; the return value is not used.
END;
$$ LANGUAGE plpgsql;

-- The four tables that hold reviewable content. Statement-level would lose the row identity, so
-- these are FOR EACH ROW.
CREATE TRIGGER content_write_item
    AFTER INSERT OR UPDATE OR DELETE ON "Item"
    FOR EACH ROW EXECUTE FUNCTION log_content_write();

CREATE TRIGGER content_write_item_option
    AFTER INSERT OR UPDATE OR DELETE ON "ItemOption"
    FOR EACH ROW EXECUTE FUNCTION log_content_write();

CREATE TRIGGER content_write_misconception
    AFTER INSERT OR UPDATE OR DELETE ON "Misconception"
    FOR EACH ROW EXECUTE FUNCTION log_content_write();

CREATE TRIGGER content_write_word
    AFTER INSERT OR UPDATE OR DELETE ON "Word"
    FOR EACH ROW EXECUTE FUNCTION log_content_write();
