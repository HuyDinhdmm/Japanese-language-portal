from flask import Blueprint, request, jsonify
from models.word_progress import WordProgress

word_progress_bp = Blueprint('word_progress', __name__)

@word_progress_bp.route('/', methods=['POST'])
def create_word_progress():
    data = request.get_json()
    word_id = data.get('word_id')
    status = data.get('status', 'new')
    progress = WordProgress.create(word_id, status)
    return jsonify(progress), 201

@word_progress_bp.route('/<int:word_id>', methods=['PUT'])
def update_word_progress(word_id):
    data = request.get_json()
    status = data.get('status')
    last_studied_at = data.get('last_studied_at')
    progress = WordProgress.update(word_id, status, last_studied_at)
    return jsonify(progress)

@word_progress_bp.route('/<int:word_id>', methods=['GET'])
def get_word_progress(word_id):
    progress = WordProgress.get_by_word_id(word_id)
    if not progress:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(progress)

@word_progress_bp.route('/group/<int:group_id>', methods=['GET'])
def get_by_group(group_id):
    progresses = WordProgress.get_by_group(group_id)
    return jsonify(progresses)

@word_progress_bp.route('/group/<int:group_id>/stats', methods=['GET'])
def get_group_stats(group_id):
    stats = WordProgress.get_group_stats(group_id)
    return jsonify(stats)

@word_progress_bp.route('/all-groups/stats', methods=['GET'])
def get_all_groups_stats():
    stats = WordProgress.get_all_groups_stats()
    return jsonify(stats)

@word_progress_bp.route('/status/<status>', methods=['GET'])
def get_by_status(status):
    progresses = WordProgress.get_by_status(status)
    return jsonify(progresses)

@word_progress_bp.route('/learned/over/<int:days>', methods=['GET'])
def get_learned_over_days(days):
    progresses = WordProgress.get_learned_over_days(days)
    return jsonify(progresses) 