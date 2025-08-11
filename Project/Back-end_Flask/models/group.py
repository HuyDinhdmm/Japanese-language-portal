from .database import Database
from .word import Word

class Group:
    def __init__(self, id, name, description, words_count):
        self.id = id
        self.name = name
        self.description = description
        self.words_count = words_count

    @staticmethod
    def get_all(page=1, per_page=10):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('SELECT COUNT(*) FROM groups')
        total = cursor.fetchone()[0]
        
        cursor.execute('SELECT * FROM groups LIMIT ? OFFSET ?', (per_page, offset))
        groups = [Group(*row) for row in cursor.fetchall()]
        
        return {
            'items': [group.__dict__ for group in groups],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def get_by_id(group_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM groups WHERE id = ?', (group_id,))
        row = cursor.fetchone()
        return Group(*row).__dict__ if row else None

    @staticmethod
    def get_group_words(group_id, page=1, per_page=10, raw=False):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        
        cursor.execute('''
            SELECT COUNT(*) FROM word_groups WHERE group_id = ?
        ''', (group_id,))
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT w.* FROM words w
            JOIN word_groups wg ON w.id = wg.word_id
            WHERE wg.group_id = ?
            LIMIT ? OFFSET ?
        ''', (group_id, per_page, offset))
        
        words = [Word(*row) for row in cursor.fetchall()]
        
        return {
            'items': [word.__dict__ for word in words] if not raw else words,
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def create(name, description=""):
        """Tạo group mới"""
        db = Database()
        cursor = db.cursor()
        cursor.execute('INSERT INTO groups (name, description, words_count) VALUES (?, ?, ?)',
                       (name, description, 0))
        db.commit()
        group_id = cursor.lastrowid
        return Group.get_by_id(group_id)

    @staticmethod
    def add_word_to_group(group_id, word_id):
        """Thêm từ vựng vào group"""
        db = Database()
        cursor = db.cursor()
        
        # Kiểm tra xem từ đã có trong group chưa
        cursor.execute('SELECT COUNT(*) FROM word_groups WHERE group_id = ? AND word_id = ?',
                       (group_id, word_id))
        if cursor.fetchone()[0] > 0:
            return False  # Từ đã tồn tại trong group
        
        # Thêm từ vào group
        cursor.execute('INSERT INTO word_groups (group_id, word_id) VALUES (?, ?)',
                       (group_id, word_id))
        
        # Cập nhật số lượng từ trong group
        cursor.execute('''
            UPDATE groups 
            SET words_count = (SELECT COUNT(*) FROM word_groups WHERE group_id = ?)
            WHERE id = ?
        ''', (group_id, group_id))
        
        db.commit()
        return True

    @staticmethod
    def remove_word_from_group(group_id, word_id):
        """Xóa từ vựng khỏi group (không xóa từ khỏi database)"""
        db = Database()
        cursor = db.cursor()
        
        # Kiểm tra xem từ có trong group không
        cursor.execute('SELECT COUNT(*) FROM word_groups WHERE group_id = ? AND word_id = ?',
                       (group_id, word_id))
        if cursor.fetchone()[0] == 0:
            return False  # Từ không tồn tại trong group
        
        # Xóa từ khỏi group
        cursor.execute('DELETE FROM word_groups WHERE group_id = ? AND word_id = ?',
                       (group_id, word_id))
        
        # Cập nhật số lượng từ trong group
        cursor.execute('''
            UPDATE groups 
            SET words_count = (SELECT COUNT(*) FROM word_groups WHERE group_id = ?)
            WHERE id = ?
        ''', (group_id, group_id))
        
        db.commit()
        return True

    @staticmethod
    def delete(group_id):
        """Xóa group khỏi database (và các liên kết word_groups liên quan)"""
        db = Database()
        cursor = db.cursor()
        # Kiểm tra group có tồn tại không
        cursor.execute('SELECT COUNT(*) FROM groups WHERE id = ?', (group_id,))
        if cursor.fetchone()[0] == 0:
            return False
        # Xóa các liên kết word_groups
        cursor.execute('DELETE FROM word_groups WHERE group_id = ?', (group_id,))
        # Xóa group
        cursor.execute('DELETE FROM groups WHERE id = ?', (group_id,))
        db.commit()
        return True 