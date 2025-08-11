from .database import Database

class Word:
    def __init__(self, id, kanji, romaji, vietnamese, parts, jlpt_level=None):
        self.id = id
        self.kanji = kanji
        self.romaji = romaji
        self.vietnamese = vietnamese
        self.parts = parts
        self.jlpt_level = jlpt_level

    @staticmethod
    def get_all(page=1, per_page=10, search=None):
        db = Database()
        cursor = db.cursor()
        offset = (page - 1) * per_page
        params = []
        where = ''
        if search:
            search_like = f"%{search.lower()}%"
            where = '''WHERE LOWER(w.kanji) LIKE ?
                        OR LOWER(w.romaji) LIKE ?
                        OR LOWER(w.vietnamese) LIKE ?
                        OR LOWER(w.parts) LIKE ?
                        OR LOWER(j.level) LIKE ?'''
            params = [search_like] * 5
        # Đếm tổng số kết quả phù hợp
        count_query = f'''SELECT COUNT(*) FROM words w LEFT JOIN jlpt_levels j ON w.id = j.word_id {where}'''
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        # Lấy dữ liệu trang hiện tại
        query = f'''
            SELECT w.id, w.kanji, w.romaji, w.vietnamese, w.parts, j.level
            FROM words w
            LEFT JOIN jlpt_levels j ON w.id = j.word_id
            {where}
            LIMIT ? OFFSET ?
        '''
        cursor.execute(query, params + [per_page, offset])
        words = [Word(*row) for row in cursor.fetchall()]
        return {
            'items': [word.__dict__ for word in words],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @staticmethod
    def get_by_id(word_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT w.id, w.kanji, w.romaji, w.vietnamese, w.parts, j.level
            FROM words w
            LEFT JOIN jlpt_levels j ON w.id = j.word_id
            WHERE w.id = ?
        ''', (word_id,))
        row = cursor.fetchone()
        return Word(*row).__dict__ if row else None

    @staticmethod
    def create(data):
        db = Database()
        cursor = db.cursor()
        cursor.execute('INSERT INTO words (kanji, romaji, vietnamese, parts) VALUES (?, ?, ?, ?)',
                       (data.get('kanji'), data.get('romaji'), data.get('vietnamese'), data.get('parts')))
        db.commit()
        word_id = cursor.lastrowid
        return Word.get_by_id(word_id)

    @staticmethod
    def update(word_id, data):
        db = Database()
        cursor = db.cursor()
        cursor.execute('UPDATE words SET kanji=?, romaji=?, vietnamese=?, parts=? WHERE id=?',
                       (data.get('kanji'), data.get('romaji'), data.get('vietnamese'), data.get('parts'), word_id))
        db.commit()
        return Word.get_by_id(word_id)

    @staticmethod
    def delete(word_id):
        db = Database()
        cursor = db.cursor()
        
        print(f"DEBUG: Deleting word ID: {word_id}")
        
        # Lấy danh sách groups chứa từ này trước khi xóa
        cursor.execute('SELECT DISTINCT group_id FROM word_groups WHERE word_id = ?', (word_id,))
        affected_groups = [row[0] for row in cursor.fetchall()]
        print(f"DEBUG: Word {word_id} is in groups: {affected_groups}")
        
        # Kiểm tra word_progress trước khi xóa
        cursor.execute('SELECT COUNT(*) FROM word_progress WHERE word_id = ?', (word_id,))
        word_progress_count = cursor.fetchone()[0]
        print(f"DEBUG: Word {word_id} has {word_progress_count} progress records")
        
        # Xóa từ
        cursor.execute('DELETE FROM words WHERE id=?', (word_id,))
        print(f"DEBUG: Deleted word {word_id} from words table")
        
        # Cập nhật words_count cho tất cả groups bị ảnh hưởng
        for group_id in affected_groups:
            cursor.execute('''
                UPDATE groups 
                SET words_count = (SELECT COUNT(*) FROM word_groups WHERE group_id = ?)
                WHERE id = ?
            ''', (group_id, group_id))
            print(f"DEBUG: Updated words_count for group {group_id}")
        
        db.commit()
        print(f"DEBUG: Delete operation completed for word {word_id}")
        return {'message': 'Word deleted successfully'}

    @staticmethod
    def find_by_kanji_jlpt_level(kanji, jlpt_level):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT w.id, w.kanji, w.romaji, w.vietnamese, w.parts, j.level
            FROM words w
            LEFT JOIN jlpt_levels j ON w.id = j.word_id
            WHERE w.kanji = ? AND j.level = ?
        ''', (kanji, jlpt_level))
        row = cursor.fetchone()
        return Word(*row).__dict__ if row else None 