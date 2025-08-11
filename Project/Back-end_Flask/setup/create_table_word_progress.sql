CREATE TABLE IF NOT EXISTS word_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('new', 'learning', 'learned')),
    last_studied_at DATETIME,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
); 