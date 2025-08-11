CREATE TABLE IF NOT EXISTS word_review_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES word_reviews(id),
    FOREIGN KEY (word_id) REFERENCES words(id)
); 