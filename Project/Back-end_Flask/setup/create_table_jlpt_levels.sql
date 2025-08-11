CREATE TABLE IF NOT EXISTS jlpt_levels (
    word_id INTEGER PRIMARY KEY,
    level TEXT NOT NULL, -- ví dụ: 'N5', 'N4', 'N3', 'N2', 'N1'
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
); 