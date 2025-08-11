from flask import Blueprint, jsonify, request
from models import Word
from utils import get_pagination_params

words_bp = Blueprint('words', __name__)

@words_bp.route('/', methods=['GET'])
def get_all_words():
    try:
        page, per_page = get_pagination_params()
        search = request.args.get('search')
        result = Word.get_all(page=page, per_page=per_page, search=search)
        for item in result['items']:
            if 'jlpt_level' not in item:
                item['jlpt_level'] = None
        return jsonify({'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@words_bp.route('/', methods=['POST'])
def create_word():
    try:
        data = request.get_json()
        word = Word.create(data)
        return jsonify({'data': word}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@words_bp.route('/<int:id>', methods=['PUT'])
def update_word(id):
    try:
        data = request.get_json()
        word = Word.update(id, data)
        if not word:
            return jsonify({'error': 'Word not found'}), 404
        return jsonify({'data': word})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@words_bp.route('/<int:id>', methods=['DELETE'])
def delete_word(id):
    try:
        result = Word.delete(id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@words_bp.route('/<int:word_id>', methods=['GET'])
def get_word(word_id):
    word = Word.get_by_id(word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    if 'jlpt_level' not in word:
        word['jlpt_level'] = None
    return jsonify(word) 