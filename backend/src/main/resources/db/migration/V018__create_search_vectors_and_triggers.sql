-- Alter tables to add search_vector columns
ALTER TABLE users ADD COLUMN search_vector TSVECTOR;
ALTER TABLE tasks ADD COLUMN search_vector TSVECTOR;
ALTER TABLE comments ADD COLUMN search_vector TSVECTOR;

-- Create GIN indexes
CREATE INDEX idx_users_search ON users USING GIN (search_vector);
CREATE INDEX idx_tasks_search ON tasks USING GIN (search_vector);
CREATE INDEX idx_comments_search ON comments USING GIN (search_vector);

-- Trigger for users
CREATE OR REPLACE FUNCTION users_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_search_vector_trigger
    BEFORE INSERT OR UPDATE OF display_name, email ON users
    FOR EACH ROW EXECUTE FUNCTION users_search_vector_update();

-- Trigger for tasks
CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description ON tasks
    FOR EACH ROW EXECUTE FUNCTION tasks_search_vector_update();

-- Trigger for comments
CREATE OR REPLACE FUNCTION comments_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_search_vector_trigger
    BEFORE INSERT OR UPDATE OF content ON comments
    FOR EACH ROW EXECUTE FUNCTION comments_search_vector_update();
