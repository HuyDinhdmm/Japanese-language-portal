import pytest
from app import app
from models.database import db
from models import Word, Group, StudyActivity, StudySession, Dashboard
import os

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            db.init(app)
            yield client

def test_root_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome to Japanese Learning API' in response.data

def test_api_test_endpoint(client):
    response = client.get('/api/test')
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    assert 'timestamp' in data

def test_test_db_endpoint(client):
    response = client.get('/api/test-db')
    assert response.status_code == 200
    data = response.get_json()
    
    # Test words
    assert 'words' in data
    assert 'items' in data['words']
    assert 'total' in data['words']
    
    # Test groups
    assert 'groups' in data
    assert 'items' in data['groups']
    assert 'total' in data['groups']
    
    # Test activities
    assert 'activities' in data
    assert isinstance(data['activities'], list)

def test_test_models_endpoint(client):
    response = client.get('/api/test-models')
    assert response.status_code == 200
    data = response.get_json()
    
    # Test word
    if data['word']:
        assert 'id' in data['word']
        assert 'kanji' in data['word']
        assert 'romaji' in data['word']
        assert 'vietnamese' in data['word']
        assert 'parts' in data['word']
    
    # Test group
    if data['group']:
        assert 'id' in data['group']
        assert 'name' in data['group']
        assert 'description' in data['group']
        assert 'words_count' in data['group']
    
    # Test group words
    if data['group_words']:
        assert 'items' in data['group_words']
        assert 'total' in data['group_words']
    
    # Test activity
    if data['activity']:
        assert 'id' in data['activity']
        assert 'name' in data['activity']
        assert 'url' in data['activity']
        assert 'preview_url' in data['activity']
    
    # Test activity launch info
    if data['activity_launch']:
        assert 'id' in data['activity_launch']
        assert 'name' in data['activity_launch']
        assert 'url' in data['activity_launch']
        assert 'preview_url' in data['activity_launch']
    
    # Test sessions
    if data['sessions']:
        assert 'items' in data['sessions']
        assert 'total' in data['sessions']

def test_test_dashboard_endpoint(client):
    """Test the test dashboard endpoint."""
    response = client.get('/api/test-dashboard')
    assert response.status_code == 200
    data = response.get_json()
    
    # Kiểm tra cấu trúc dữ liệu trả về
    assert 'last_session' in data
    assert 'study_progress' in data
    assert 'quick_stats' in data
    assert 'performance' in data
    
    # Kiểm tra last_session
    last_session = data['last_session']
    assert last_session is not None
    assert 'id' in last_session
    assert 'group_id' in last_session
    assert 'study_activity_id' in last_session
    assert 'created_at' in last_session
    
    # Kiểm tra study_progress
    progress = data['study_progress']
    assert 'total_sessions' in progress
    assert 'total_words' in progress
    assert 'average_score' in progress
    
    # Kiểm tra quick_stats
    stats = data['quick_stats']
    assert 'total_words' in stats
    assert 'total_groups' in stats
    assert 'total_activities' in stats
    
    # Kiểm tra performance
    graph = data['performance']
    assert isinstance(graph, list)
    if len(graph) > 0:
        assert 'date' in graph[0]
        assert 'sessions_count' in graph[0]
        assert 'average_score' in graph[0]

def test_word_model(client):
    with app.app_context():
        # Test get_all
        words = Word.get_all(page=1, per_page=2)
        assert 'items' in words
        assert 'total' in words
        assert 'page' in words
        assert 'per_page' in words
        
        # Test get_by_id
        if words['items']:
            word_id = words['items'][0]['id']
            word = Word.get_by_id(word_id)
            assert word is not None
            assert word['id'] == word_id
            assert 'kanji' in word
            assert 'romaji' in word
            assert 'vietnamese' in word
            assert 'parts' in word

def test_group_model(client):
    with app.app_context():
        # Test get_all
        groups = Group.get_all(page=1, per_page=2)
        assert 'items' in groups
        assert 'total' in groups
        assert 'page' in groups
        assert 'per_page' in groups
        
        # Test get_by_id and get_group_words
        if groups['items']:
            group_id = groups['items'][0]['id']
            group = Group.get_by_id(group_id)
            assert group is not None
            assert group['id'] == group_id
            assert 'name' in group
            assert 'description' in group
            assert 'words_count' in group
            
            group_words = Group.get_group_words(group_id, page=1, per_page=2)
            assert 'items' in group_words
            assert 'total' in group_words
            assert 'page' in group_words
            assert 'per_page' in group_words

def test_generate_words(client):
    # Gửi POST request với dữ liệu hợp lệ
    payload = {
        "thematicCategory": "sports"
    }
    response = client.post('/api/generate_words', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 5
    for item in data:
        assert "kanji" in item
        assert "romaji" in item
        assert "vietnamese" in item
        assert "parts" in item
        assert isinstance(item["parts"], list)
        for part in item["parts"]:
            assert "kanji" in part
            assert "romaji" in part

    # Gửi POST request thiếu trường thematicCategory
    response = client.post('/api/generate_words', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data

    print("REQUEST BODY:", data)

def test_index_questions_api(client):
    youtube_url = "https://www.youtube.com/watch?v=WjTK_u1JI8c&list=PLkGU7DnOLgRPxTNFRc7utpuwhWSQC35wC&index=21"
    section_num = 1
    video_id = "WjTK_u1JI8c"
    # Đảm bảo file questions đã tồn tại (nếu chưa, tạo trước)
    questions_path = os.path.join(os.path.dirname(__file__), "data", "questions", f"{video_id}_section{section_num}_questions.txt")
    if not os.path.exists(questions_path):
        # Đảm bảo section cũng tồn tại
        split_path = os.path.join(os.path.dirname(__file__), "data", "split", video_id, f"{video_id}_section{section_num}.txt")
        if not os.path.exists(split_path):
            # Đảm bảo transcript cũng tồn tại
            transcript_path = os.path.join(os.path.dirname(__file__), "data", "transcripts", f"{video_id}.txt")
            if not os.path.exists(transcript_path):
                resp = client.post('/api/listening/get_transcript', data=youtube_url, content_type='text/plain')
                assert resp.status_code == 200
            resp = client.post('/api/listening/split_transcript', json={"youtube_url": youtube_url})
            assert resp.status_code == 200
        resp = client.post('/api/listening/structure_section', json={"youtube_url": youtube_url, "section_num": section_num})
        assert resp.status_code == 200
    # Test index_questions
    resp = client.post('/api/listening/index_questions', json={"youtube_url": youtube_url, "section_num": section_num})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "vectorstore_path" in data
    assert "num_questions" in data
    # Kiểm tra file questions vẫn tồn tại
    assert os.path.exists(questions_path)

def test_listening_pipeline(client):
    youtube_url = "https://www.youtube.com/watch?v=WjTK_u1JI8c&list=PLkGU7DnOLgRPxTNFRc7utpuwhWSQC35wC&index=21"
    section_num = 1
    video_id = "WjTK_u1JI8c"

    # 1. get_transcript
    resp = client.post('/api/listening/get_transcript', json={"youtube_url": youtube_url})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "transcript" in data
    # Kiểm tra file transcript đã tạo
    transcript_path = os.path.join(os.path.dirname(__file__), "data", "transcripts", f"{video_id}.txt")
    assert os.path.exists(transcript_path)

    # 2. split_transcript
    resp = client.post('/api/listening/split_transcript', json={"youtube_url": youtube_url})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "sections_saved" in data
    # Kiểm tra file section đã tạo
    split_path = os.path.join(os.path.dirname(__file__), "data", "split", video_id, f"{video_id}_section{section_num}.txt")
    assert os.path.exists(split_path)

    # 3. structure_section
    resp = client.post('/api/listening/structure_section', json={"youtube_url": youtube_url, "section_num": section_num})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "questions_saved" in data
    # Kiểm tra file questions đã tạo
    questions_path = os.path.join(os.path.dirname(__file__), "data", "questions", f"{video_id}_section{section_num}_questions.txt")
    assert os.path.exists(questions_path)

    # 4. index_questions
    resp = client.post('/api/listening/index_questions', json={"youtube_url": youtube_url, "section_num": section_num})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "vectorstore_path" in data
    assert "num_questions" in data

def test_get_transcript_raw_string(client):
    youtube_url = "https://www.youtube.com/watch?v=WjTK_u1JI8c&list=PLkGU7DnOLgRPxTNFRc7utpuwhWSQC35wC&index=21"
    resp = client.post('/api/listening/get_transcript', data=youtube_url, content_type='text/plain')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "transcript" in data

def test_split_transcript_api(client):
    youtube_url = "https://www.youtube.com/watch?v=WjTK_u1JI8c&list=PLkGU7DnOLgRPxTNFRc7utpuwhWSQC35wC&index=21"
    section_num = 1
    video_id = "WjTK_u1JI8c"
    # Đảm bảo transcript đã tồn tại (nếu chưa, tạo trước)
    transcript_path = os.path.join(os.path.dirname(__file__), "data", "transcripts", f"{video_id}.txt")
    if not os.path.exists(transcript_path):
        resp = client.post('/api/listening/get_transcript', data=youtube_url, content_type='text/plain')
        assert resp.status_code == 200
    # Test split_transcript
    resp = client.post('/api/listening/split_transcript', json={"youtube_url": youtube_url})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "sections_saved" in data
    # Kiểm tra file section đã tạo
    split_path = os.path.join(os.path.dirname(__file__), "data", "split", video_id, f"{video_id}_section{section_num}.txt")
    assert os.path.exists(split_path)

def test_structure_section_api(client):
    youtube_url = "https://www.youtube.com/watch?v=WjTK_u1JI8c&list=PLkGU7DnOLgRPxTNFRc7utpuwhWSQC35wC&index=21"
    section_num = 1
    video_id = "WjTK_u1JI8c"
    # Đảm bảo section đã tồn tại (nếu chưa, tạo trước)
    split_path = os.path.join(os.path.dirname(__file__), "data", "split", video_id, f"{video_id}_section{section_num}.txt")
    if not os.path.exists(split_path):
        # Đảm bảo transcript cũng tồn tại
        transcript_path = os.path.join(os.path.dirname(__file__), "data", "transcripts", f"{video_id}.txt")
        if not os.path.exists(transcript_path):
            resp = client.post('/api/listening/get_transcript', data=youtube_url, content_type='text/plain')
            assert resp.status_code == 200
        resp = client.post('/api/listening/split_transcript', json={"youtube_url": youtube_url})
        assert resp.status_code == 200
    # Test structure_section
    resp = client.post('/api/listening/structure_section', json={"youtube_url": youtube_url, "section_num": section_num})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "questions_saved" in data
    # Kiểm tra file questions đã tạo
    questions_path = os.path.join(os.path.dirname(__file__), "data", "questions", f"{video_id}_section{section_num}_questions.txt")
    assert os.path.exists(questions_path)
