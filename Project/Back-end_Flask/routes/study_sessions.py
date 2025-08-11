from flask import Blueprint, jsonify, request
from models import StudySession
from utils import get_pagination_params

study_sessions_bp = Blueprint('study_sessions', __name__)

@study_sessions_bp.route('/', methods=['GET'])
def get_all_sessions():
    page, per_page = get_pagination_params()
    return jsonify(StudySession.get_all(page=page, per_page=per_page))

@study_sessions_bp.route('/<int:session_id>', methods=['GET'])
def get_session(session_id):
    session = StudySession.get_by_id(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(session)

@study_sessions_bp.route('/activity/<int:activity_id>', methods=['GET'])
def get_sessions_by_activity(activity_id):
    page, per_page = get_pagination_params()
    return jsonify(StudySession.get_by_activity_id(activity_id, page=page, per_page=per_page))

@study_sessions_bp.route('/group/<int:group_id>', methods=['GET'])
def get_sessions_by_group(group_id):
    page, per_page = get_pagination_params()
    return jsonify(StudySession.get_by_group_id(group_id, page=page, per_page=per_page))

@study_sessions_bp.route('/<int:session_id>/words', methods=['GET'])
def get_session_words(session_id):
    page, per_page = get_pagination_params()
    return jsonify(StudySession.get_session_words(session_id, page=page, per_page=per_page))

@study_sessions_bp.route('/<int:session_id>/record_review', methods=['POST'])
def record_word_review(session_id):
    data = request.get_json()
    if not data or 'word_id' not in data or 'correct' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    return jsonify(StudySession.record_word_review(session_id, data['word_id'], data['correct']))

@study_sessions_bp.route('/reset_history', methods=['POST'])
def reset_history():
    return jsonify(StudySession.reset_history())

@study_sessions_bp.route('/continue_learning', methods=['GET'])
def get_continue_learning():
    session = StudySession.get_continue_learning()
    if not session:
        return jsonify({'error': 'No active session found'}), 404
    return jsonify(session)

@study_sessions_bp.route('/', methods=['POST'])
def create_session():
    data = request.get_json()
    group_id = data.get('group_id')
    study_activity_id = data.get('study_activity_id')
    if not group_id or not study_activity_id:
        return jsonify({'error': 'Missing group_id or study_activity_id'}), 400
    session = StudySession.create(group_id, study_activity_id)
    if not session:
        return jsonify({'error': 'Failed to create session'}), 500
    return jsonify(session), 201 