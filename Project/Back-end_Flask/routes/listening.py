from flask import Blueprint, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled, VideoUnavailable, NoTranscriptFound
)
import os
import re
import requests
import time
import json

# --- VECTOR STORE LOGIC ---
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../listening-comp/backend')))

from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions

listening_bp = Blueprint('listening', __name__)

def extract_video_id(url: str):
    # Dùng regex để lấy video_id từ mọi dạng URL
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    if match:
        return match.group(1)
    return None

@listening_bp.route('/get_transcript', methods=['POST'])
def get_transcript_route():
    youtube_url = None
    if request.is_json:
        data = request.get_json()
        youtube_url = data.get('youtube_url')
    else:
        youtube_url = request.data.decode('utf-8').strip()
    if not youtube_url:
        return jsonify({'error': 'youtube_url is required'}), 400
    video_id = extract_video_id(youtube_url)
    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    dir_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'transcripts')
    os.makedirs(dir_path, exist_ok=True)
    filename = os.path.join(dir_path, f"{video_id}.txt")
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ja", "en"])
    except NoTranscriptFound:
        return jsonify({'success': False, 'error': 'No transcript available for ja/en.'}), 404
    except TranscriptsDisabled:
        return jsonify({'success': False, 'error': 'Transcripts are disabled for this video.'}), 403
    except VideoUnavailable:
        return jsonify({'success': False, 'error': 'Video is unavailable.'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f"Unexpected error: {str(e)}"}), 500
    with open(filename, 'w', encoding='utf-8') as f:
        for entry in transcript:
            f.write(f"{entry['text']}\n")
    return jsonify({
        'success': True,
        'transcript': [entry['text'] for entry in transcript],
        'file_saved': True
    })

def split_transcript(input_path: str, video_id: str):
    with open(input_path, encoding='utf-8') as f:
        text = f.read()
    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\u3000', ' ')
    text = re.sub(r'(\d+)\s*[\r\n]+\s*番', r'\1番', text)
    text = re.sub(r"(問題[1-7])", r"\n\1", text)
    text = re.sub(r'(選んでください)(\s*)(\d+番)', r'\1\n\3番', text)
    sections = re.split(r'\n(?=問題[1-7])', text)
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'split', video_id)
    os.makedirs(out_dir, exist_ok=True)
    saved_files = []
    for section in sections:
        match = re.search(r'問題([1-7])', section)
        if not match:
            continue
        section_num = match.group(1)
        out_path = os.path.join(out_dir, f"{video_id}_section{section_num}.txt")
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(section.strip())
        saved_files.append(out_path)
    return saved_files

@listening_bp.route('/split_transcript', methods=['POST'])
def split_transcript_route():
    data = request.get_json()
    youtube_url = data.get('youtube_url')
    if not youtube_url:
        return jsonify({'error': 'youtube_url is required'}), 400
    video_id = extract_video_id(youtube_url)
    transcript_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'transcripts', f"{video_id}.txt")
    if not os.path.exists(transcript_path):
        return jsonify({'error': 'Transcript file not found'}), 404
    try:
        saved_files = split_transcript(transcript_path, video_id)
        return jsonify({'success': True, 'sections_saved': saved_files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def clean_text(text: str) -> str:
    text = text.replace('\u3000', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

MODEL_ID = "deepseek-r1-distill-llama-70b"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Lấy từ biến môi trường
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

PROMPT = (
    "You are a Japanese Language Proficiency Test (JLPT) Listening Comprehension Question Extractor.\n\n"
    "Your task is to extract all actual test questions from the given listening transcript. Each question typically includes: a short situation introduction, a spoken dialogue, a question, and either four or three options.\n\n"
    "For each question, output in one of these formats (choose the correct one based on the question type):\n\n"
    "<question>\n"
    "Introduction:\n[situation in Japanese]\n\n"
    "Conversation:\n[full dialogue in Japanese]\n\n"
    "Question:\n[question in Japanese]\n\n"
    "Options:\n1. [Option 1 in Japanese]\n2. [Option 2 in Japanese]\n3. [Option 3 in Japanese]\n4. [Option 4 in Japanese]\n"
    "CorrectAnswer: [1|2|3|4] (the number of the correct option)\n</question>\n\n"
    "OR (for response-type questions with 3 options):\n\n"
    "<question>\n"
    "Introduction:\n[short statement or question in Japanese]\n\n"
    "Conversation:\n1. [first option in Japanese]\n2. [second option in Japanese]\n3. [third option in Japanese]\n\n"
    "Question:\n一番いいものはどれですか?\n\n"
    "Options:\n1. [repeat first option]\n2. [repeat second option]\n3. [repeat third option]\n"
    "CorrectAnswer: [1|2|3] (the number of the correct option)\n</question>\n\n"
    "Rules:\n"
    "- Each question MUST have exactly 4 options (or exactly 3 for response-type). Do NOT leave any option blank or missing.\n"
    "- For each question, you MUST provide exactly one correct answer, indicated by the CorrectAnswer field.\n"
    "- The CorrectAnswer must be a single number (1, 2, 3, or 4) matching one of the options.\n"
    "- If the transcript does not provide enough information for all options, you MUST create plausible options yourself to ensure the correct number.\n"
    "- Only real questions, ignore practice/例 or instructions\n"
    "- No headers like '問題1' or '1番', no explanations like '1番いいものは3番です'\n"
    "- No translation, no extra text, no explanations\n"
    "- Remove unrelated phrases like 'では始めます', '練習しましょう', '[音楽]'\n"
)

def call_groq_api(prompt: str, transcript: str, model_id: str = MODEL_ID):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    full_prompt = f"{prompt}\n\nHere is the transcript:\n{transcript}"
    data = {
        "model": model_id,
        "messages": [
            {"role": "user", "content": full_prompt}
        ],
        "temperature": 0
    }
    response = requests.post(GROQ_URL, headers=headers, json=data)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

@listening_bp.route('/structure_section', methods=['POST'])
def structure_section_route():
    data = request.get_json()
    youtube_url = data.get('youtube_url')
    section_num = data.get('section_num')
    if not youtube_url or not section_num:
        return jsonify({'error': 'youtube_url and section_num are required'}), 400
    video_id = extract_video_id(youtube_url)
    section_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'split', video_id, f"{video_id}_section{section_num}.txt")
    out_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'questions', f"{video_id}_section{section_num}_questions.txt")
    if not os.path.exists(section_path):
        return jsonify({'error': 'Section file not found'}), 404
    try:
        with open(section_path, 'r', encoding='utf-8') as f:
            section_text = clean_text(f.read())
        result = call_groq_api(PROMPT, section_text)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(result)
        return jsonify({'success': True, 'questions_saved': out_path, 'content': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

class LocalEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model_id="sentence-transformers/all-MiniLM-L6-v2"):
        self.model_id = model_id
        self.model = SentenceTransformer(self.model_id)
    def __call__(self, texts):
        try:
            return self.model.encode(texts, show_progress_bar=False).tolist()
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            return [[0.0] * 384 for _ in texts]
    def name(self):
        return f"LocalEmbeddingFunction-{self.model_id}"

def parse_questions_from_file(filename):
    questions = []
    current_question = {}
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if line.startswith('<question>'):
                current_question = {}
            elif line.startswith('Introduction:'):
                i += 1
                if i < len(lines):
                    current_question['Introduction'] = lines[i].strip()
            elif line.startswith('Conversation:'):
                conversation_lines = []
                i += 1
                while i < len(lines) and not lines[i].startswith('Question:'):
                    conversation_lines.append(lines[i].strip())
                    i += 1
                current_question['Conversation'] = '\n'.join(conversation_lines).strip()
                i -= 1
            elif line.startswith('Question:'):
                i += 1
                if i < len(lines):
                    current_question['Question'] = lines[i].strip()
            elif line.startswith('Options:'):
                options = []
                i += 1
                while i < len(lines) and (lines[i].strip().startswith(('1.', '2.', '3.', '4.'))):
                    option = lines[i].strip()
                    options.append(option[2:].strip())
                    i += 1
                current_question['Options'] = options
                i -= 1
            elif line.startswith('</question>'):
                if current_question:
                    questions.append(current_question)
                    current_question = {}
            i += 1
        return questions
    except Exception as e:
        print(f"Error parsing questions from {filename}: {str(e)}")
        return []

@listening_bp.route('/index_questions', methods=['POST'])
def index_questions_route():
    data = request.get_json()
    youtube_url = data.get('youtube_url')
    section_num = data.get('section_num')
    if not youtube_url or not section_num:
        return jsonify({'error': 'youtube_url and section_num are required'}), 400
    video_id = extract_video_id(youtube_url)
    questions_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'questions', f"{video_id}_section{section_num}_questions.txt")
    if not os.path.exists(questions_path):
        return jsonify({'error': 'Questions file not found'}), 404
    try:
        # Parse questions
        questions = parse_questions_from_file(questions_path)
        if not questions:
            return jsonify({'error': 'No questions found in file'}), 400
        # Prepare ChromaDB
        vectorstore_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'vectorstore'))
        client = chromadb.PersistentClient(path=vectorstore_path)
        embedding_fn = LocalEmbeddingFunction()
        collection = client.get_or_create_collection(
            name="jlpt_questions",
            embedding_function=embedding_fn,
            metadata={"description": "All JLPT listening comprehension questions (all sections)"}
        )
        # Add questions
        ids = []
        documents = []
        metadatas = []
        for idx, question in enumerate(questions):
            question_id = f"{video_id}_{section_num}_{idx}"
            ids.append(question_id)
            metadatas.append({
                "video_id": video_id,
                "section": int(section_num),
                "question_index": idx,
                "full_structure": json.dumps(question, ensure_ascii=False)
            })
            document = f"""
Introduction: {question.get('Introduction', '')}
Conversation: {question.get('Conversation', '')}
Question: {question.get('Question', '')}
Options: {'; '.join(question.get('Options', []))}
"""
            documents.append(document)
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        return jsonify({'success': True, 'indexed_file': questions_path, 'vectorstore_path': vectorstore_path, 'num_questions': len(questions)})
    except Exception as e:
        print("DEBUG ERROR in index_questions_route:", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

def search_similar_questions(conversation: str, n_results: int = 3):
    """
    Truy vấn vector db để lấy các câu hỏi JLPT tương tự dựa trên embedding của đoạn hội thoại.
    """
    # Prepare ChromaDB
    vectorstore_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'vectorstore'))
    client = chromadb.PersistentClient(path=vectorstore_path)
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="sentence-transformers/all-MiniLM-L6-v2")
    collection = client.get_or_create_collection(
        name="jlpt_questions",
        embedding_function=embedding_fn,
        metadata={"description": "All JLPT listening comprehension questions (all sections)"}
    )
    # Search
    results = collection.query(query_texts=[conversation], n_results=n_results)
    # Parse results
    similar_questions = []
    for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
        try:
            q = json.loads(meta['full_structure'])
            similar_questions.append(q)
        except Exception:
            continue
    return similar_questions

def generate_question_from_conversation(conversation: str) -> dict:
    """
    Generate a JLPT-style listening comprehension question from a given Japanese conversation.
    Returns a dict with Introduction, Conversation, Question, Options (3 hoặc 4), and CorrectAnswer.
    """
    prompt = (
        "You are a JLPT listening comprehension question generator.\n\n"
        "Given the following Japanese conversation, create a new JLPT-style listening comprehension question.\n\n"
        "Output the question in this format (choose 3 or 4 options as appropriate):\n\n"
        "<question>\n"
        "Introduction:\n[short context in Japanese]\n\n"
        "Conversation:\n[copy exactly as provided below]\n\n"
        "Question:\n[question in Japanese]\n\n"
        "Options:\n1. [Option 1 in Japanese]\n2. [Option 2 in Japanese]\n3. [Option 3 in Japanese]\n[4. [Option 4 in Japanese]]\n"
        "CorrectAnswer: [1|2|3|4] (the number of the correct option)\n</question>\n\n"
        "Rules:\n"
        "- Use the conversation exactly as provided, do not change or summarize it.\n"
        "- Only generate one question.\n"
        "- There must be exactly one correct answer, indicated by the CorrectAnswer field.\n"
        "- If the conversation only supports 3 options, use 3. Otherwise, use 4.\n"
        "- Do not add any explanation, translation, or extra text.\n"
        "- Output only the <question>...</question> block.\n\n"
        f"Conversation:\n{conversation}\n"
    )
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": MODEL_ID,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    try:
        response = requests.post(GROQ_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()["choices"][0]["message"]["content"]
        # Parse <question>...</question> block
        match = re.search(r'<question>([\s\S]*?)</question>', result)
        if not match:
            return None
        block = match.group(1)
        # Parse fields
        def get_field(label):
            m = re.search(rf'{label}:\s*([\s\S]*?)(?=\n\s*(?:Introduction|Conversation|Question|Options|CorrectAnswer):|$)', block)
            return m.group(1).strip() if m else ''
        introduction = get_field('Introduction')
        conversation_text = get_field('Conversation')
        question_text = get_field('Question')
        # Parse options
        options_match = re.search(r'Options:\s*([\s\S]*?)(?=\n\s*CorrectAnswer:|$)', block)
        options = []
        if options_match:
            lines = options_match.group(1).split('\n')
            for line in lines:
                opt = line.strip()
                if re.match(r'^[1-4]\.', opt):
                    options.append(opt[2:].strip())
        # Parse correct answer
        correct_match = re.search(r'CorrectAnswer:\s*([1-4])', block)
        correct_answer = correct_match.group(1) if correct_match else None
        if not (introduction and conversation_text and question_text and options and correct_answer):
            return None
        return {
            'Introduction': introduction,
            'Conversation': conversation_text,
            'Question': question_text,
            'Options': options,
            'CorrectAnswer': correct_answer
        }
    except Exception as e:
        print(f"Error generating question from conversation: {str(e)}")
        return None

@listening_bp.route('/generate_question_from_conversation', methods=['POST'])
def generate_question_from_conversation_route():
    data = request.get_json()
    conversation = data.get('conversation')
    if not conversation:
        return jsonify({'error': 'conversation is required'}), 400
    result = generate_question_from_conversation(conversation)
    if not result:
        return jsonify({'success': False, 'error': 'Could not generate question'}), 500
    return jsonify({'success': True, 'question': result}) 