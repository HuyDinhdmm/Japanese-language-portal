from .database import Database
from .study_session import StudySession

class Dashboard:
    @staticmethod
    def get_last_study_session():
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, group_id, study_activity_id, created_at 
            FROM study_sessions 
            ORDER BY created_at DESC 
            LIMIT 1
        ''')
        row = cursor.fetchone()
        return StudySession(*row).__dict__ if row else None

    @staticmethod
    def get_study_progress():
        db = Database()
        cursor = db.cursor()
        # Lấy tổng số session từ bảng study_sessions
        cursor.execute('SELECT COUNT(*) FROM study_sessions')
        total_sessions = cursor.fetchone()[0]

        # Lấy tổng số từ đã review (nếu muốn giữ)
        cursor.execute('SELECT COUNT(DISTINCT word_id) FROM word_review_items')
        total_words = cursor.fetchone()[0]

        return {
            'total_sessions': total_sessions,
            'total_words': total_words,
            'average_score': 0  # Giá trị mặc định là 0
        }

    @staticmethod
    def get_quick_stats():
        db = Database()
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM words')
        total_words = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM groups')
        total_groups = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM study_activities')
        total_activities = cursor.fetchone()[0]
        
        return {
            'total_words': total_words,
            'total_groups': total_groups,
            'total_activities': total_activities
        }

    @staticmethod
    def get_performance_graph():
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sessions_count
            FROM study_sessions
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 31
        ''')
        results = cursor.fetchall()
        return [{
            'date': row[0],
            'sessions_count': row[1],
            'average_score': 0  # Giá trị mặc định là 0
        } for row in results]

    @staticmethod
    def full_reset():
        """Reset all study progress data"""
        db = Database()
        cursor = db.cursor()
        
        # Xóa dữ liệu từ các bảng liên quan
        cursor.execute('DELETE FROM word_review_items')
        cursor.execute('DELETE FROM study_sessions')
        
        # Commit thay đổi
        db.commit()
        
        return {
            'message': 'All study progress data has been reset successfully',
            'status': 'success'
        } 