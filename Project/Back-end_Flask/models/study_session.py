from .database import Database
from .word import Word

class StudySession:
    def __init__(self, id, group_id, study_activity_id, created_at):
        self.id = id
        self.group_id = group_id
        self.study_activity_id = study_activity_id
        self.created_at = created_at

    @staticmethod
    def get_all(page=1, per_page=10):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('SELECT COUNT(*) FROM study_sessions')
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at 
            FROM study_sessions 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (per_page, offset))
        sessions = [StudySession(*row) for row in cursor.fetchall()]
        
        return {
            'items': [session.__dict__ for session in sessions],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def get_by_id(session_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at 
            FROM study_sessions 
            WHERE id = ?
        ''', (session_id,))
        row = cursor.fetchone()
        return StudySession(*row).__dict__ if row else None

    @staticmethod
    def get_by_activity_id(activity_id, page=1, per_page=10):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('SELECT COUNT(*) FROM study_sessions WHERE study_activity_id = ?', (activity_id,))
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at 
            FROM study_sessions 
            WHERE study_activity_id = ? 
            LIMIT ? OFFSET ?
        ''', (activity_id, per_page, offset))
        sessions = [StudySession(*row) for row in cursor.fetchall()]
        
        return {
            'items': [session.__dict__ for session in sessions],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def get_by_group_id(group_id, page=1, per_page=10):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('SELECT COUNT(*) FROM study_sessions WHERE group_id = ?', (group_id,))
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at 
            FROM study_sessions 
            WHERE group_id = ? 
            LIMIT ? OFFSET ?
        ''', (group_id, per_page, offset))
        sessions = [StudySession(*row) for row in cursor.fetchall()]
        
        return {
            'items': [session.__dict__ for session in sessions],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def get_session_words(session_id, page=1, per_page=10):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('SELECT COUNT(*) FROM word_review_items WHERE session_id = ?', (session_id,))
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT w.id, w.kanji, w.romaji, w.vietnamese, w.parts
            FROM words w
            JOIN word_review_items wri ON w.id = wri.word_id
            WHERE wri.session_id = ?
            LIMIT ? OFFSET ?
        ''', (session_id, per_page, offset))
        words = [Word(*row) for row in cursor.fetchall()]
        
        return {
            'items': [word.__dict__ for word in words],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def create(group_id, study_activity_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)
        ''', (group_id, study_activity_id))
        db.commit()
        session_id = cursor.lastrowid
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at FROM study_sessions WHERE id = ?
        ''', (session_id,))
        row = cursor.fetchone()
        return StudySession(*row).__dict__ if row else None