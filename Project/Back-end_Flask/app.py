from flask import Flask, jsonify
from flask_cors import CORS
from routes.words import words_bp
from routes.groups import groups_bp
from routes.study_activities import study_activities_bp
from routes.study_sessions import study_sessions_bp
from routes.dashboard import dashboard_bp
from routes.word_progress import word_progress_bp
from routes.wordImport import word_import_bp
from routes.listening import listening_bp
from models.database import db, init_db, Database
from models import Word, Group, StudyActivity, StudySession, Dashboard
import os
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8080"}})

# Initialize database
init_db(app)

# Register blueprints
app.register_blueprint(words_bp, url_prefix='/api/words')
app.register_blueprint(groups_bp, url_prefix='/api/groups')
app.register_blueprint(study_activities_bp, url_prefix='/api/study_activities')
app.register_blueprint(study_sessions_bp, url_prefix='/api/study_sessions')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(word_progress_bp, url_prefix='/api/word_progress')
app.register_blueprint(word_import_bp, url_prefix='/api')
app.register_blueprint(listening_bp, url_prefix='/api/listening')

# Load environment variables
load_dotenv()

@app.route('/')
def root():
    return jsonify({
        'message': 'Welcome to Japanese Learning API',
        'version': '1.0.0'
    })

@app.route('/api')
def welcome():
    return jsonify({
        'message': 'Welcome to Japanese Learning API',
        'version': '1.0.0'
    })

@app.route('/api/test')
def test():
    return jsonify({
        'message': 'API is working!',
        'status': 'success',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/test-db')
def test_db():
    words = Word.get_all(page=1, per_page=2)
    groups = Group.get_all(page=1, per_page=2)
    activities = StudyActivity.get_all()
    return jsonify({
        'words': words,
        'groups': groups,
        'activities': activities
    })

@app.route('/api/test-models')
def test_models():
    word = Word.get_by_id(1)
    group = Group.get_by_id(1)
    group_words = Group.get_group_words(1, page=1, per_page=2)
    activity = StudyActivity.get_by_id(1)
    activity_launch = StudyActivity.get_launch_info(1)
    sessions = StudySession.get_all(page=1, per_page=2)
    return jsonify({
        'word': word,
        'group': group,
        'group_words': group_words,
        'activity': activity,
        'activity_launch': activity_launch,
        'sessions': sessions
    })

@app.route('/api/test-dashboard')
def test_dashboard():
    last_session = Dashboard.get_last_study_session()
    study_progress = Dashboard.get_study_progress()
    quick_stats = Dashboard.get_quick_stats()
    performance = Dashboard.get_performance_graph()
    return jsonify({
        'last_session': last_session,
        'study_progress': study_progress,
        'quick_stats': quick_stats,
        'performance': performance
    })

@app.route('/test-database')
def test_database():
    """Test endpoint để kiểm tra database"""
    try:
        db = Database()
        cursor = db.cursor()
        
        # Đếm số lượng records trong các bảng
        cursor.execute('SELECT COUNT(*) FROM words')
        words_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM word_groups')
        word_groups_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM word_progress')
        word_progress_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM groups')
        groups_count = cursor.fetchone()[0]
        
        # Lấy thông tin groups
        cursor.execute('SELECT id, name, words_count FROM groups')
        groups_info = [{'id': row[0], 'name': row[1], 'words_count': row[2]} for row in cursor.fetchall()]
        
        return jsonify({
            'words_count': words_count,
            'word_groups_count': word_groups_count,
            'word_progress_count': word_progress_count,
            'groups_count': groups_count,
            'groups_info': groups_info
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/cleanup-orphaned-records')
def cleanup_orphaned_records():
    """Cleanup orphaned records trong word_groups và word_progress"""
    try:
        db = Database()
        cursor = db.cursor()
        
        # Đếm orphaned records trước khi cleanup
        cursor.execute('''
            SELECT COUNT(*) FROM word_groups wg 
            LEFT JOIN words w ON wg.word_id = w.id 
            WHERE w.id IS NULL
        ''')
        orphaned_word_groups = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(*) FROM word_progress wp 
            LEFT JOIN words w ON wp.word_id = w.id 
            WHERE w.id IS NULL
        ''')
        orphaned_word_progress = cursor.fetchone()[0]
        
        # Xóa orphaned records
        cursor.execute('''
            DELETE FROM word_groups 
            WHERE word_id NOT IN (SELECT id FROM words)
        ''')
        deleted_word_groups = cursor.rowcount
        
        cursor.execute('''
            DELETE FROM word_progress 
            WHERE word_id NOT IN (SELECT id FROM words)
        ''')
        deleted_word_progress = cursor.rowcount
        
        # Cập nhật words_count trong groups
        cursor.execute('''
            UPDATE groups 
            SET words_count = (
                SELECT COUNT(*) 
                FROM word_groups wg 
                INNER JOIN words w ON wg.word_id = w.id 
                WHERE wg.group_id = groups.id
            )
        ''')
        
        db.commit()
        
        return jsonify({
            'message': 'Cleanup completed',
            'orphaned_word_groups_found': orphaned_word_groups,
            'orphaned_word_progress_found': orphaned_word_progress,
            'deleted_word_groups': deleted_word_groups,
            'deleted_word_progress': deleted_word_progress
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    response = {
        'error': str(error),
        'message': 'An error occurred'
    }
    if app.debug:
        response['traceback'] = str(error.__traceback__)
    return jsonify(response), 500

if __name__ == '__main__':
    app.run(debug=True)