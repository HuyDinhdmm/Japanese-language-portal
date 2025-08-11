from flask import Blueprint, jsonify
from models import StudyActivity
from utils import get_pagination_params

study_activities_bp = Blueprint('study_activities', __name__)

@study_activities_bp.route('/', methods=['GET'])
def get_all_activities():
    return jsonify({'activities': StudyActivity.get_all()})

@study_activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity(activity_id):
    activity = StudyActivity.get_by_id(activity_id)
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404
    return jsonify(activity)

@study_activities_bp.route('/<int:activity_id>/launch_info', methods=['GET'])
def get_launch_info(activity_id):
    launch_info = StudyActivity.get_launch_info(activity_id)
    if not launch_info:
        return jsonify({'error': 'Activity not found'}), 404
    return jsonify(launch_info) 