import os
import json
import re
from flask import Blueprint, request, jsonify
from models.word import Word
from models.word_progress import WordProgress
from models.group import Group
from models.database import Database
# Nếu bạn dùng groq, cần cài đặt thư viện groq (pip install groq)
try:
    import groq
except ImportError:
    groq = None
import json5
import demjson3

word_import_bp = Blueprint('word_import', __name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY") 

def save_jlpt_level(word_id, jlpt_level):
    """Lưu JLPT level cho từ vựng vào database"""
    db = Database()
    cursor = db.cursor()
    cursor.execute('INSERT OR REPLACE INTO jlpt_levels (word_id, level) VALUES (?, ?)',
                   (word_id, jlpt_level))
    db.commit()

def import_words_to_database(words_data, thematic_category):
    """Import danh sách từ vựng vào database và tạo group"""
    imported_words = []
    
    # Tạo group mới với tên là chủ đề
    group_description = f"Từ vựng về chủ đề: {thematic_category}"
    created_group = Group.create(thematic_category, group_description)
    group_id = created_group['id']
    
    for word_data in words_data:
        jlpt_level = word_data.get('jlpt_level', 'N5')
        kanji = word_data.get('kanji', '')
        # Check trùng từ theo kanji + jlpt_level
        existed_word = Word.find_by_kanji_jlpt_level(kanji, jlpt_level)
        if existed_word:
            word_id = existed_word['id']
            # Nếu đã có thì chỉ thêm vào group
            Group.add_word_to_group(group_id, word_id)
            imported_words.append({
                'id': word_id,
                'kanji': existed_word['kanji'],
                'romaji': existed_word['romaji'],
                'vietnamese': existed_word['vietnamese'],
                'jlpt_level': jlpt_level,
                'parts': json.loads(existed_word['parts']) if isinstance(existed_word['parts'], str) else existed_word['parts'],
                'status': 'existed'
            })
        else:
            # Tạo từ vựng mới
            word_info = {
                'kanji': kanji,
                'romaji': word_data.get('romaji', ''),
                'vietnamese': word_data.get('vietnamese', ''),
                'parts': json.dumps(word_data.get('parts', []))
            }
            created_word = Word.create(word_info)
            word_id = created_word['id']
            save_jlpt_level(word_id, jlpt_level)
            WordProgress.create(word_id, status='new')
            Group.add_word_to_group(group_id, word_id)
            imported_words.append({
                'id': word_id,
                'kanji': word_info['kanji'],
                'romaji': word_info['romaji'],
                'vietnamese': word_info['vietnamese'],
                'jlpt_level': jlpt_level,
                'parts': word_data.get('parts', []),
                'status': 'new'
            })
    return {
        'imported_words': imported_words,
        'group': created_group
    }

def extract_valid_json_objects(text):
    import json
    valid = []
    seen = set()
    brace_stack = []
    start_idx = None
    for i, c in enumerate(text):
        if c == '{':
            if not brace_stack:
                start_idx = i
            brace_stack.append('{')
        elif c == '}':
            if brace_stack:
                brace_stack.pop()
                if not brace_stack and start_idx is not None:
                    obj_str = text[start_idx:i+1]
                    try:
                        obj = json.loads(obj_str)
                        required = {"kanji", "romaji", "vietnamese", "jlpt_level", "parts"}
                        if not required.issubset(obj):
                            continue
                        key = (obj["kanji"], obj["jlpt_level"])
                        if key in seen:
                            continue
                        seen.add(key)
                        valid.append(obj)
                    except Exception:
                        continue
    return valid

def parse_json_response(text, fallback_data):
    import re
    import json
    import json5
    import demjson3
    # Loại bỏ <think>...</think> và markdown
    text = re.sub(r'<think>[\s\S]*?</think>', '', text)
    text = text.replace('```json', '').replace('```', '').strip()
    # Tìm đoạn bắt đầu bằng [ hoặc {
    match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
    if match:
        json_candidate = match.group(1)
        for parser in (json.loads, json5.loads, demjson3.decode):
            try:
                return parser(json_candidate)
            except Exception as e:
                print(f"Parser {parser.__name__} failed: {e}")
    # Nếu vẫn lỗi, thì lọc object hợp lệ
    valid_objs = extract_valid_json_objects(text)
    if valid_objs:
        return valid_objs
    print("All parse attempts failed. Using fallback.")
    return fallback_data

@word_import_bp.route('/generate_words', methods=['POST'])
def generate_words():
    try:
        data = request.json
        thematic_category = data.get('thematicCategory')
        jlpt_level = data.get('jlptLevel', 'N5')  # Default to N5 if not provided
        
        if not thematic_category:
            return jsonify({"error": "Thematic category is required"}), 400

        # Map JLPT levels to difficulty descriptions
        jlpt_descriptions = {
            'N5': 'cơ bản nhất (N5) - từ vựng đơn giản, thường dùng trong cuộc sống hàng ngày',
            'N4': 'sơ cấp (N4) - từ vựng cơ bản đến trung cấp, thường gặp trong giao tiếp',
            'N3': 'trung cấp (N3) - từ vựng trung cấp, phù hợp cho người học có nền tảng',
            'N2': 'trung cao cấp (N2) - từ vựng khá phức tạp, thường dùng trong văn viết',
            'N1': 'cao cấp (N1) - từ vựng nâng cao, thường gặp trong văn học và báo chí'
        }
        
        jlpt_description = jlpt_descriptions.get(jlpt_level, jlpt_descriptions['N5'])

        prompt = f'''
Hãy tạo danh sách từ vựng tiếng Nhật theo chủ đề: "{thematic_category}" với độ khó {jlpt_description}.

Yêu cầu:

1. **Chỉ trả về duy nhất một mảng JSON hợp lệ** (không thêm bất kỳ text, giải thích, markdown, hoặc chú thích nào khác). Nếu không đúng định dạng này, hoặc không đủ 10 từ, kết quả sẽ bị bỏ qua.

2. Mỗi phần tử là một từ vựng tiếng Nhật, có cấu trúc chính xác gồm:
  - "kanji": từ tiếng Nhật (có thể là kanji, hiragana hoặc katakana)
  - "romaji": cách đọc romaji của toàn bộ từ (chuẩn Hepburn, viết thường, có dấu macron nếu cần)
  - "vietnamese": nghĩa tiếng Việt của từ (ngắn gọn, phổ thông, không dùng tiếng Anh)
  - "jlpt_level": "{jlpt_level}" (level JLPT của từ vựng này)
  - "parts": mảng các thành phần nhỏ của từ. Mỗi phần tử trong "parts" là một object có:
    - "kanji": ký tự đơn (có thể là một chữ kanji, một ký tự hiragana hoặc katakana)
    - "romaji": mảng các âm tiết romaji tương ứng với ký tự đó (ví dụ: "shoku" → ["sho", "ku"])

3. Cách xử lý cụ thể:
  - Nếu từ là **từ ghép kanji**: phân tách từng chữ kanji và romaji tương ứng theo âm tiết.
  - Nếu từ được viết bằng **hiragana hoặc katakana** (ví dụ: "らーめん", "ラーメン", "すし", "てんぷら"):
    - Giữ nguyên kana trong trường "kanji"
    - Phân tách từng ký tự kana trong "parts" và cung cấp romaji tương ứng (ví dụ: "らーめん" → [{{ "kanji": "ら", "romaji": ["ra"] }}, ...])
  - Nếu từ là **tên riêng** (ví dụ: Mt. Fuji): sử dụng từ gốc tiếng Nhật trong "kanji" (ví dụ: "富士") và cung cấp nghĩa tiếng Việt tương ứng ("Núi Phú Sĩ").
  - Nếu từ không có dạng kanji phổ biến (như "ramen", "sushi", "tempura"): sử dụng dạng kana (ひらがな hoặc カタカナ) trong trường "kanji".

4. Các nguyên tắc bắt buộc:
  - Không được để trống trường "parts". Không dùng giá trị như "Không có", "None", hay tương tự.
  - Trường "vietnamese" phải là tiếng Việt phổ biến, không để nguyên tiếng Anh như "Sushi", "Tempura".
  - Chọn từ vựng phù hợp với level JLPT {jlpt_level}: {jlpt_description}
  - Không thêm bất kỳ mô tả, tiêu đề, giải thích hay văn bản nào ngoài mảng JSON.
  - **Nếu không trả về đủ 10 từ, hoặc không đúng định dạng JSON hợp lệ, kết quả sẽ bị bỏ qua.**

---

Ví dụ định dạng đúng:

[
  {{
    "kanji": "日本",
    "romaji": "nihon",
    "vietnamese": "Nhật Bản",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "日", "romaji": ["ni"] }},
      {{ "kanji": "本", "romaji": ["hon"] }}
    ]
  }},
  {{
    "kanji": "東京",
    "romaji": "tōkyō",
    "vietnamese": "Tokyo",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "東", "romaji": ["tō"] }},
      {{ "kanji": "京", "romaji": ["kyō"] }}
    ]
  }},
  {{
    "kanji": "すし",
    "romaji": "sushi",
    "vietnamese": "sushi",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "す", "romaji": ["su"] }},
      {{ "kanji": "し", "romaji": ["shi"] }}
    ]
  }},
  {{
    "kanji": "てんぷら",
    "romaji": "tempura",
    "vietnamese": "món chiên tempura",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "て", "romaji": ["te"] }},
      {{ "kanji": "ん", "romaji": ["n"] }},
      {{ "kanji": "ぷ", "romaji": ["pu"] }},
      {{ "kanji": "ら", "romaji": ["ra"] }}
    ]
  }},
  {{
    "kanji": "ラーメン",
    "romaji": "rāmen",
    "vietnamese": "mì ramen",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "ラ", "romaji": ["ra"] }},
      {{ "kanji": "ー", "romaji": ["ā"] }},
      {{ "kanji": "メ", "romaji": ["me"] }},
      {{ "kanji": "ン", "romaji": ["n"] }}
    ]
  }},
  {{
    "kanji": "富士",
    "romaji": "fuji",
    "vietnamese": "Núi Phú Sĩ",
    "jlpt_level": "{jlpt_level}",
    "parts": [
      {{ "kanji": "富", "romaji": ["fu"] }},
      {{ "kanji": "士", "romaji": ["ji"] }}
    ]
  }}
]
'''

        if groq is None:
            return jsonify({"error": "groq library not installed. Please run 'pip install groq'"}), 500

        client = groq.Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",  # hoặc model bạn muốn
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        ) 
        text = response.choices[0].message.content

        print("===== RAW LLM RESPONSE START =====")
        print(text)
        print("===== RAW LLM RESPONSE END =====")

        # Fallback vocabulary for each JLPT level
        fallback_vocabulary = {
            'N5': [
                {
                    "kanji": "水",
                    "romaji": "mizu",
                    "vietnamese": "nước",
                    "jlpt_level": "N5",
                    "parts": [{"kanji": "水", "romaji": ["mi", "zu"]}]
                },
                {
                    "kanji": "食べる",
                    "romaji": "taberu",
                    "vietnamese": "ăn",
                    "jlpt_level": "N5",
                    "parts": [{"kanji": "食", "romaji": ["ta"]}, {"kanji": "べ", "romaji": ["be"]}, {"kanji": "る", "romaji": ["ru"]}]
                },
                {
                    "kanji": "大きい",
                    "romaji": "ōkii",
                    "vietnamese": "to",
                    "jlpt_level": "N5",
                    "parts": [{"kanji": "大", "romaji": ["ō"]}, {"kanji": "き", "romaji": ["ki"]}, {"kanji": "い", "romaji": ["i"]}]
                }
            ],
            'N4': [
                {
                    "kanji": "準備",
                    "romaji": "junbi",
                    "vietnamese": "chuẩn bị",
                    "jlpt_level": "N4",
                    "parts": [{"kanji": "準", "romaji": ["jun"]}, {"kanji": "備", "romaji": ["bi"]}]
                },
                {
                    "kanji": "説明",
                    "romaji": "setsumei",
                    "vietnamese": "giải thích",
                    "jlpt_level": "N4",
                    "parts": [{"kanji": "説", "romaji": ["setsu"]}, {"kanji": "明", "romaji": ["mei"]}]
                },
                {
                    "kanji": "大切",
                    "romaji": "taisetsu",
                    "vietnamese": "quan trọng",
                    "jlpt_level": "N4",
                    "parts": [{"kanji": "大", "romaji": ["tai"]}, {"kanji": "切", "romaji": ["setsu"]}]
                }
            ],
            'N3': [
                {
                    "kanji": "改善",
                    "romaji": "kaizen",
                    "vietnamese": "cải thiện",
                    "jlpt_level": "N3",
                    "parts": [{"kanji": "改", "romaji": ["kai"]}, {"kanji": "善", "romaji": ["zen"]}]
                },
                {
                    "kanji": "確認",
                    "romaji": "kakunin",
                    "vietnamese": "xác nhận",
                    "jlpt_level": "N3",
                    "parts": [{"kanji": "確", "romaji": ["kaku"]}, {"kanji": "認", "romaji": ["nin"]}]
                },
                {
                    "kanji": "理解",
                    "romaji": "rikai",
                    "vietnamese": "hiểu",
                    "jlpt_level": "N3",
                    "parts": [{"kanji": "理", "romaji": ["ri"]}, {"kanji": "解", "romaji": ["kai"]}]
                }
            ],
            'N2': [
                {
                    "kanji": "実現",
                    "romaji": "jitsugen",
                    "vietnamese": "thực hiện",
                    "jlpt_level": "N2",
                    "parts": [{"kanji": "実", "romaji": ["jitsu"]}, {"kanji": "現", "romaji": ["gen"]}]
                },
                {
                    "kanji": "影響",
                    "romaji": "eikyō",
                    "vietnamese": "ảnh hưởng",
                    "jlpt_level": "N2",
                    "parts": [{"kanji": "影", "romaji": ["ei"]}, {"kanji": "響", "romaji": ["kyō"]}]
                },
                {
                    "kanji": "開発",
                    "romaji": "kaihatsu",
                    "vietnamese": "phát triển",
                    "jlpt_level": "N2",
                    "parts": [{"kanji": "開", "romaji": ["kai"]}, {"kanji": "発", "romaji": ["hatsu"]}]
                }
            ],
            'N1': [
                {
                    "kanji": "継続",
                    "romaji": "keizoku",
                    "vietnamese": "tiếp tục",
                    "jlpt_level": "N1",
                    "parts": [{"kanji": "継", "romaji": ["kei"]}, {"kanji": "続", "romaji": ["zoku"]}]
                },
                {
                    "kanji": "促進",
                    "romaji": "sokushin",
                    "vietnamese": "thúc đẩy",
                    "jlpt_level": "N1",
                    "parts": [{"kanji": "促", "romaji": ["soku"]}, {"kanji": "進", "romaji": ["shin"]}]
                },
                {
                    "kanji": "維持",
                    "romaji": "iji",
                    "vietnamese": "duy trì",
                    "jlpt_level": "N1",
                    "parts": [{"kanji": "維", "romaji": ["i"]}, {"kanji": "持", "romaji": ["ji"]}]
                }
            ]
        }

        json_response = parse_json_response(text, fallback_vocabulary.get(jlpt_level, fallback_vocabulary['N5']))
        return jsonify(json_response)
    except Exception as e:
        import traceback
        print("Error generating vocabulary:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to generate vocabulary"}), 500

@word_import_bp.route('/import_words', methods=['POST'])
def import_words():
    """Import từ vựng vào database, chỉ check trùng theo kanji + jlpt_level"""
    try:
        data = request.json
        words_data = data.get('words', [])
        thematic_category = data.get('thematicCategory')
        
        if not words_data:
            return jsonify({"error": "No words data provided"}), 400
        
        if not thematic_category:
            return jsonify({"error": "Thematic category is required"}), 400
        
        # Import words vào database với logic chỉ check trùng kanji + jlpt_level
        result = import_words_to_database(words_data, thematic_category)
        
        return jsonify({
            "message": f"Successfully imported {len(result['imported_words'])} words",
            "imported_words": result['imported_words'],
            "group": result['group']
        })
        
    except Exception as e:
        import traceback
        print("Error importing words:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to import words"}), 500 