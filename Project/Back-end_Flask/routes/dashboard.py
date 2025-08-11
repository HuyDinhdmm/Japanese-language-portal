from flask import Blueprint, jsonify
from models import Dashboard

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/last_session', methods=['GET'])
def get_last_study_session():
    session = Dashboard.get_last_study_session()
    if not session:
        return jsonify({'error': 'No study session found'}), 404
    return jsonify(session)

@dashboard_bp.route('/study_progress', methods=['GET'])
def get_study_progress():
    return jsonify(Dashboard.get_study_progress())

@dashboard_bp.route('/quick_stats', methods=['GET'])
def get_quick_stats():
    return jsonify(Dashboard.get_quick_stats())

@dashboard_bp.route('/performance_graph', methods=['GET'])
def get_performance_graph():
    return jsonify(Dashboard.get_performance_graph())

@dashboard_bp.route('/reset', methods=['POST'])
def full_reset():
    return jsonify(Dashboard.full_reset()) 