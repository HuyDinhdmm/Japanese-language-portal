from flask import Blueprint, jsonify
from models import Group
from utils import get_pagination_params

groups_bp = Blueprint('groups', __name__)

@groups_bp.route('/', methods=['GET'])
def get_all_groups():
    page, per_page = get_pagination_params()
    return jsonify({'data': Group.get_all(page=page, per_page=per_page)})

@groups_bp.route('/<int:group_id>', methods=['GET'])
def get_group(group_id):
    group = Group.get_by_id(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    return jsonify(group)

@groups_bp.route('/<int:group_id>/words', methods=['GET'])
def get_group_words(group_id):
    group = Group.get_by_id(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    page, per_page = get_pagination_params()
    return jsonify(Group.get_group_words(group_id, page=page, per_page=per_page))

@groups_bp.route('/<int:group_id>/words/<int:word_id>', methods=['DELETE'])
def remove_word_from_group(group_id, word_id):
    """Xóa từ khỏi group"""
    try:
        # Kiểm tra group có tồn tại không
        group = Group.get_by_id(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Xóa từ khỏi group
        success = Group.remove_word_from_group(group_id, word_id)
        if not success:
            return jsonify({'error': 'Word not found in group'}), 404
        
        return jsonify({'message': 'Word removed from group successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@groups_bp.route('/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    """Xóa group khỏi database"""
    try:
        success = Group.delete(group_id)
        if not success:
            return jsonify({'error': 'Group not found'}), 404
        return jsonify({'message': 'Group deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500 