from .database import Database
from datetime import datetime, timedelta

class WordProgress:
    def __init__(self, id, word_id, status, last_studied_at):
        self.id = id
        self.word_id = word_id
        self.status = status
        self.last_studied_at = last_studied_at

    @staticmethod
    def create(word_id, status='new'):
        db = Database()
        cursor = db.cursor()
        now = datetime.utcnow().isoformat()
        cursor.execute('INSERT INTO word_progress (word_id, status, last_studied_at) VALUES (?, ?, ?)',
                       (word_id, status, now))
        db.commit()
        return WordProgress.get_by_word_id(word_id)

    @staticmethod
    def update(word_id, status=None, last_studied_at=None):
        db = Database()
        cursor = db.cursor()
        fields = []
        params = []
        if status:
            fields.append('status=?')
            params.append(status)
        if last_studied_at:
            fields.append('last_studied_at=?')
            params.append(last_studied_at)
        if not fields:
            return None
        params.append(word_id)
        cursor.execute(f'UPDATE word_progress SET {", ".join(fields)} WHERE word_id=?', params)
        db.commit()
        return WordProgress.get_by_word_id(word_id)

    @staticmethod
    def get_by_word_id(word_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('SELECT id, word_id, status, last_studied_at FROM word_progress WHERE word_id=?', (word_id,))
        row = cursor.fetchone()
        return WordProgress(*row).__dict__ if row else None

    @staticmethod
    def get_by_status(status):
        db = Database()
        cursor = db.cursor()
        cursor.execute('SELECT id, word_id, status, last_studied_at FROM word_progress WHERE status=?', (status,))
        return [WordProgress(*row).__dict__ for row in cursor.fetchall()]

    @staticmethod
    def get_learned_over_days(days=7):
        db = Database()
        cursor = db.cursor()
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        cursor.execute('''
            SELECT id, word_id, status, last_studied_at FROM word_progress
            WHERE status="learned" AND last_studied_at < ?
        ''', (cutoff,))
        return [WordProgress(*row).__dict__ for row in cursor.fetchall()]

    @staticmethod
    def get_by_group(group_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT wp.id, wp.word_id, wp.status, wp.last_studied_at 
            FROM word_progress wp
            JOIN word_groups wg ON wp.word_id = wg.word_id
            WHERE wg.group_id = ?
        ''', (group_id,))
        rows = cursor.fetchall()
        return {
            'items': [WordProgress(*row).__dict__ for row in rows],
            'total': len(rows)
        }

    @staticmethod
    def get_group_stats(group_id):
        db = Database()
        cursor = db.cursor()
        
        # Get total words in group
        cursor.execute('''
            SELECT COUNT(*) FROM word_groups WHERE group_id = ?
        ''', (group_id,))
        total_words = cursor.fetchone()[0]
        
        # Get learned words count
        cursor.execute('''
            SELECT COUNT(*) FROM word_progress wp
            JOIN word_groups wg ON wp.word_id = wg.word_id
            WHERE wg.group_id = ? AND wp.status = 'learned'
        ''', (group_id,))
        learned_words = cursor.fetchone()[0]
        
        # Get learning words count
        cursor.execute('''
            SELECT COUNT(*) FROM word_progress wp
            JOIN word_groups wg ON wp.word_id = wg.word_id
            WHERE wg.group_id = ? AND wp.status = 'learning'
        ''', (group_id,))
        learning_words = cursor.fetchone()[0]
        
        # Get new words count
        cursor.execute('''
            SELECT COUNT(*) FROM word_progress wp
            JOIN word_groups wg ON wp.word_id = wg.word_id
            WHERE wg.group_id = ? AND wp.status = 'new'
        ''', (group_id,))
        new_words = cursor.fetchone()[0]
        
        # Get last studied date
        cursor.execute('''
            SELECT MAX(wp.last_studied_at) FROM word_progress wp
            JOIN word_groups wg ON wp.word_id = wg.word_id
            WHERE wg.group_id = ?
        ''', (group_id,))
        last_studied = cursor.fetchone()[0]
        
        return {
            'total_words': total_words,
            'learned_words': learned_words,
            'learning_words': learning_words,
            'new_words': new_words,
            'last_studied': last_studied,
            'progress_percentage': round((learned_words / total_words * 100) if total_words > 0 else 0, 1)
        }

    @staticmethod
    def get_all_groups_stats():
        db = Database()
        cursor = db.cursor()
        
        # Debug: Kiểm tra dữ liệu thực tế
        cursor.execute('SELECT COUNT(*) FROM words')
        total_words_in_db = cursor.fetchone()[0]
        print(f"DEBUG: Total words in words table: {total_words_in_db}")
        
        cursor.execute('SELECT COUNT(*) FROM word_groups')
        total_word_groups = cursor.fetchone()[0]
        print(f"DEBUG: Total word_groups: {total_word_groups}")
        
        cursor.execute('SELECT COUNT(*) FROM word_progress')
        total_word_progress = cursor.fetchone()[0]
        print(f"DEBUG: Total word_progress: {total_word_progress}")
        
        # Get all groups with their stats - tính toán chính xác từ word_groups
        cursor.execute('''
            SELECT 
                g.id,
                g.name,
                COALESCE(word_count, 0) as total_words,
                COALESCE(learned_count, 0) as learned_words,
                COALESCE(learning_count, 0) as learning_words,
                COALESCE(new_count, 0) as new_words,
                COALESCE(last_studied, NULL) as last_studied
            FROM groups g
            LEFT JOIN (
                SELECT 
                    wg.group_id,
                    COUNT(*) as word_count,
                    COUNT(CASE WHEN wp.status = 'learned' THEN 1 END) as learned_count,
                    COUNT(CASE WHEN wp.status = 'learning' THEN 1 END) as learning_count,
                    COUNT(CASE WHEN wp.status = 'new' THEN 1 END) as new_count,
                    MAX(wp.last_studied_at) as last_studied
                FROM word_groups wg
                INNER JOIN words w ON wg.word_id = w.id  -- Chỉ lấy những words còn tồn tại
                LEFT JOIN word_progress wp ON wg.word_id = wp.word_id
                GROUP BY wg.group_id
            ) stats ON g.id = stats.group_id
        ''')
        
        rows = cursor.fetchall()
        groups_stats = []
        total_stats = {
            'total_words': 0,
            'learned_words': 0,
            'learning_words': 0,
            'new_words': 0
        }
        
        print(f"DEBUG: Found {len(rows)} groups in get_all_groups_stats")
        
        for row in rows:
            group_id, name, total_words, learned_words, learning_words, new_words, last_studied = row
            progress_percentage = round((learned_words / total_words * 100) if total_words > 0 else 0, 1)
            
            print(f"DEBUG: Group {name} (ID: {group_id}) - Total: {total_words}, Learned: {learned_words}, Learning: {learning_words}, New: {new_words}")
            
            groups_stats.append({
                'group_id': group_id,
                'name': name,
                'total_words': total_words,
                'learned_words': learned_words,
                'learning_words': learning_words,
                'new_words': new_words,
                'last_studied': last_studied,
                'progress_percentage': progress_percentage
            })
            
            total_stats['total_words'] += total_words
            total_stats['learned_words'] += learned_words
            total_stats['learning_words'] += learning_words
            total_stats['new_words'] += new_words
        
        overall_progress = round((total_stats['learned_words'] / total_stats['total_words'] * 100) if total_stats['total_words'] > 0 else 0, 1)
        
        print(f"DEBUG: Overall stats - Total: {total_stats['total_words']}, Learned: {total_stats['learned_words']}, Progress: {overall_progress}%")
        
        return {
            'groups': groups_stats,
            'overall': {
                **total_stats,
                'overall_progress': overall_progress
            }
        } 