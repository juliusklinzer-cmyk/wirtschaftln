ALTER TABLE kasse ADD COLUMN gemeldet_von TEXT REFERENCES members(id);
