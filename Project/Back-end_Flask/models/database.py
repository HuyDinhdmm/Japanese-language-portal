import sqlite3
import json
import os
from flask import g

class Database:
    def __init__(self, database='word.db'):
        """Initialize database connection with the specified database file."""
        self.database = os.path.join(os.path.dirname(os.path.dirname(__file__)), database)
        self.connection = None

    def get(self):
        """Get database connection from Flask context or create new one."""
        if 'db' not in g:
            g.db = sqlite3.connect(self.database)
            g.db.row_factory = sqlite3.Row
        return g.db

    def commit(self):
        """Commit changes to the database."""
        self.get().commit()

    def cursor(self):
        """Get database cursor."""
        connection = self.get()
        return connection.cursor()

    def close(self):
        """Close database connection."""
        db = g.pop('db', None)
        if db is not None:
            db.close()

    def setup_tables(self, cursor):
        """Create all necessary tables in the database."""
        try:
            cursor.executescript('''
                -- Create words table
                CREATE TABLE IF NOT EXISTS words (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kanji TEXT NOT NULL,
                    romaji TEXT NOT NULL,
                    vietnamese TEXT NOT NULL,
                    parts TEXT NOT NULL
                );

                -- Create groups table
                CREATE TABLE IF NOT EXISTS groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    words_count INTEGER DEFAULT 0
                );

                -- Create word_groups table (for many-to-many relationship)
                CREATE TABLE IF NOT EXISTS word_groups (
                    word_id INTEGER NOT NULL,
                    group_id INTEGER NOT NULL,
                    PRIMARY KEY (word_id, group_id),
                    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
                    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
                );

                -- Create study_activities table
                CREATE TABLE IF NOT EXISTS study_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    preview_url TEXT,
                    description TEXT,
                    release_date DATE,
                    average_duration INTEGER,
                    focus INTEGER,
                    FOREIGN KEY (focus) REFERENCES groups(id)
                );

                -- Create study_sessions table
                CREATE TABLE IF NOT EXISTS study_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER NOT NULL,
                    study_activity_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (group_id) REFERENCES groups(id),
                    FOREIGN KEY (study_activity_id) REFERENCES study_activities(id)
                );

                -- Create word_review_items table
                CREATE TABLE IF NOT EXISTS word_review_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    word_id INTEGER NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
                    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
                );

                -- Create jlpt_levels table
                CREATE TABLE IF NOT EXISTS jlpt_levels (
                    word_id INTEGER PRIMARY KEY,
                    level TEXT NOT NULL,
                    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
                );

                -- Create word_progress table
                CREATE TABLE IF NOT EXISTS word_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    word_id INTEGER NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('new', 'learning', 'learned')),
                    last_studied_at DATETIME,
                    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
                );

                -- Create triggers to update words_count in groups
                CREATE TRIGGER IF NOT EXISTS update_group_words_count_insert
                AFTER INSERT ON word_groups
                BEGIN
                    UPDATE groups 
                    SET words_count = (
                        SELECT COUNT(*) 
                        FROM word_groups 
                        WHERE group_id = NEW.group_id
                    )
                    WHERE id = NEW.group_id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_group_words_count_delete
                AFTER DELETE ON word_groups
                BEGIN
                    UPDATE groups 
                    SET words_count = (
                        SELECT COUNT(*) 
                        FROM word_groups 
                        WHERE group_id = OLD.group_id
                    )
                    WHERE id = OLD.group_id;
                END;

                -- Trigger to update words_count when a word is completely deleted from database
                CREATE TRIGGER IF NOT EXISTS update_groups_words_count_on_word_delete
                AFTER DELETE ON words
                BEGIN
                    UPDATE groups 
                    SET words_count = (
                        SELECT COUNT(*) 
                        FROM word_groups 
                        WHERE group_id = groups.id
                    );
                END;
            ''')
            self.get().commit()
            print("All tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {str(e)}")
            raise

    def load_json(self, filepath):
        """Load data from a JSON file."""
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filepath)
        with open(json_path, 'r', encoding='utf-8') as file:
            return json.load(file)

    def import_study_activities_json(self, cursor, data_json_path):
        """Import study activities from JSON file."""
        try:
            study_activities = self.load_json(data_json_path)
            for activity in study_activities:
                cursor.execute('''
                INSERT INTO study_activities (name, url, preview_url, description, release_date, average_duration, focus) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    activity['name'],
                    activity['url'],
                    activity['preview_url'],
                    activity.get('description'),
                    activity.get('release_date'),
                    activity.get('average_duration'),
                    activity.get('focus')
                ))
            self.get().commit()
            print(f"Successfully imported {len(study_activities)} study activities")
        except Exception as e:
            print(f"Error importing study activities: {str(e)}")
            raise

    def import_study_sessions_json(self, cursor, data_json_path):
        """Import study sessions from JSON file."""
        try:
            study_sessions = self.load_json(data_json_path)
            for session in study_sessions:
                cursor.execute('''
                INSERT INTO study_sessions (group_id, study_activity_id, created_at) 
                VALUES (?, ?, ?)
                ''', (
                    session['group_id'],
                    session['study_activity_id'],
                    session['created_at']
                ))
            self.get().commit()
            print(f"Successfully imported {len(study_sessions)} study sessions")
        except Exception as e:
            print(f"Error importing study sessions: {str(e)}")
            raise

    def import_word_json(self, cursor, group_name, data_json_path):
        """Import words from JSON file and add them to a group."""
        try:
            cursor.execute('''
                INSERT INTO groups (name) VALUES (?)
            ''', (group_name,))
            self.get().commit()
            
            cursor.execute('SELECT id FROM groups WHERE name = ?', (group_name,))
            group_id = cursor.fetchone()[0]
            
            words = self.load_json(data_json_path)
            for word in words:
                cursor.execute('''
                    INSERT INTO words (kanji, romaji, vietnamese, parts) 
                    VALUES (?, ?, ?, ?)
                ''', (
                    word['kanji'],
                    word['romaji'],
                    word['vietnamese'],
                    json.dumps(word['parts'])
                ))
                word_id = cursor.lastrowid
                cursor.execute('''
                    INSERT INTO word_groups (word_id, group_id) 
                    VALUES (?, ?)
                ''', (word_id, group_id))
            self.get().commit()
            
            cursor.execute('''
                UPDATE groups
                SET words_count = (
                    SELECT COUNT(*) FROM word_groups WHERE group_id = ?
                )
                WHERE id = ?
            ''', (group_id, group_id))
            self.get().commit()
            print(f"Successfully added {len(words)} words to the '{group_name}' group.")
        except Exception as e:
            print(f"Error importing words: {str(e)}")
            raise

    def import_jlpt_levels_json(self, cursor, data_json_path):
        """Import JLPT levels from JSON file."""
        try:
            jlpt_levels = self.load_json(data_json_path)
            for item in jlpt_levels:
                cursor.execute('''
                    INSERT OR REPLACE INTO jlpt_levels (word_id, level)
                    VALUES (?, ?)
                ''', (
                    item['word_id'],
                    item['level']
                ))
            self.get().commit()
            print(f"Successfully imported {len(jlpt_levels)} JLPT levels")
        except Exception as e:
            print(f"Error importing JLPT levels: {str(e)}")
            raise

    def import_word_progress_json(self, cursor, data_json_path):
        """Import word progress from JSON file."""
        try:
            progresses = self.load_json(data_json_path)
            for item in progresses:
                cursor.execute('''
                    INSERT OR REPLACE INTO word_progress (word_id, status, last_studied_at)
                    VALUES (?, ?, ?)
                ''', (
                    item['word_id'],
                    item['status'],
                    item['last_studied_at']
                ))
            self.get().commit()
            print(f"Successfully imported {len(progresses)} word progress records")
        except Exception as e:
            print(f"Error importing word progress: {str(e)}")
            raise

    def init(self, app):
        """Initialize database with tables and sample data if db does not exist."""
        with app.app_context():
            try:
                print(f"Initializing database at: {self.database}")
                db_exists = os.path.exists(self.database)
                cursor = self.cursor()
                self.setup_tables(cursor)
                self.get().commit()
                if not db_exists:
                    # Chỉ import dữ liệu mẫu nếu chưa có database
                    self.import_word_json(cursor, 'Core Verbs', 'seed/data_verbs.json')
                    self.import_word_json(cursor, 'Core Adjectives', 'seed/data_adjectives.json')
                    self.import_study_activities_json(cursor, 'seed/study_activities.json')
                    self.import_study_sessions_json(cursor, 'seed/study_sessions.json')
                    self.import_jlpt_levels_json(cursor, 'seed/jlpt_levels.json')
                    self.import_word_progress_json(cursor, 'seed/word_progress.json')
                    print("Sample data imported successfully!")
                print("Database initialization completed successfully!")
            except Exception as e:
                print(f"Error during database initialization: {str(e)}")
                raise

db = Database()
init_db = db.init