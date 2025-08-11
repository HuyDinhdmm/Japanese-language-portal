from .database import Database

class StudyActivity:
    def __init__(self, name, url, preview_url, description, release_date, average_duration, focus, id=None):
        self.id = id
        self.name = name
        self.url = url
        self.preview_url = preview_url
        self.description = description
        self.release_date = release_date
        self.average_duration = average_duration
        self.focus = focus

    @staticmethod
    def get_all():
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT name, url, preview_url, description, release_date, average_duration, focus, id 
            FROM study_activities
        ''')
        return [StudyActivity(*row).__dict__ for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(activity_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT name, url, preview_url, description, release_date, average_duration, focus, id 
            FROM study_activities 
            WHERE id = ?
        ''', (activity_id,))
        row = cursor.fetchone()
        return StudyActivity(*row).__dict__ if row else None

    @staticmethod
    def get_launch_info(activity_id):
        db = Database()
        cursor = db.cursor()
        cursor.execute('''
            SELECT name, url, preview_url, description, release_date, average_duration, focus, id 
            FROM study_activities 
            WHERE id = ?
        ''', (activity_id,))
        row = cursor.fetchone()
        if not row:
            return None
        
        activity = StudyActivity(*row)
        return {
            'id': activity.id,
            'name': activity.name,
            'url': activity.url,
            'preview_url': activity.preview_url,
            'description': activity.description,
            'release_date': activity.release_date,
            'average_duration': activity.average_duration,
            'focus': activity.focus
        } 