# 🎌 Japanese Zen Study Flow

**A comprehensive Japanese language learning platform with AI-powered features for JLPT preparation**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000.svg)](https://flask.palletsprojects.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://typescriptlang.org)

## 🌟 Features

### 📚 Core Learning Features
- **Word Management**: Add, edit, and organize Japanese vocabulary
- **Group Management**: Create study groups and organize words by categories
- **Study Activities**: Interactive learning sessions with progress tracking
- **Study Sessions**: Track study time and performance analytics
- **Statistics Dashboard**: Comprehensive learning analytics and progress reports

### 🎧 AI-Powered YouTube Learning
- **Transcript Processing**: Extract and process YouTube video transcripts
- **JLPT Question Generation**: AI-powered question creation from conversations
- **Vector Database Search**: Find similar questions using semantic search
- **Question Indexing**: Store and retrieve questions with ChromaDB

### 📥 Import & Export
- **Bulk Import**: Import words from various formats
- **Data Export**: Export learning data and progress
- **Import Filters**: Advanced filtering and validation
- **Import Statistics**: Track import success rates and errors

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Real-time Updates**: Live data synchronization
- **Interactive Charts**: Beautiful data visualization with Recharts

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
japanese-zen-study-flow-main/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   ├── api/                # API client and endpoints
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

### Backend (Flask + Python)
```
Project/Back-end_Flask/
├── routes/                 # API endpoints
│   ├── listening.py        # YouTube transcript processing
│   └── ...                 # Other route modules
├── models/                 # Database models
├── seed/                   # Database seeding
├── setup/                  # Initialization scripts
├── app.py                  # Main Flask application
└── requirements.txt        # Python dependencies
```

### AI & ML Components
- **Sentence Transformers**: Text embedding for semantic search
- **ChromaDB**: Vector database for question similarity
- **Groq API**: LLM integration for question generation
- **YouTube Transcript API**: Video content extraction

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project/Back-end_Flask
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Add your API keys
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Initialize database**
   ```bash
   python setup/init_db.py
   python seed/seed_data.py
   ```

5. **Run Flask server**
   ```bash
   python app.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd japanese-zen-study-flow-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
GROQ_API_KEY=your_groq_api_key
FLASK_ENV=development
DATABASE_URL=sqlite:///word.db

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Japanese Zen Study Flow
```

### Database Configuration
- **SQLite**: Default database for development
- **PostgreSQL**: Recommended for production
- **Migrations**: Automatic schema updates

## 📖 Usage

### Dashboard
- **Quick Access**: Navigate to Import and YouTube Listening pages
- **Progress Overview**: View learning statistics and achievements
- **Recent Activity**: Track recent study sessions and words

### Word Management
1. **Add Words**: Input Japanese vocabulary with meanings
2. **Create Groups**: Organize words by JLPT level or topic
3. **Study Mode**: Practice with spaced repetition algorithm

### YouTube Learning
1. **Input URL**: Paste YouTube video URL
2. **Process Transcript**: Extract and split transcript into sections
3. **Generate Questions**: AI creates JLPT-style questions
4. **Index & Search**: Store questions in vector database

### Import System
1. **Upload File**: CSV, Excel, or text formats
2. **Configure Filters**: Set validation rules and mappings
3. **Review Results**: Check import success and errors
4. **Apply Changes**: Commit validated data to database

## 🧪 Testing

### Backend Tests
```bash
cd Project/Back-end_Flask
python -m pytest test_app.py -v
```

### Frontend Tests
```bash
cd japanese-zen-study-flow-main
npm test
npm run test:coverage
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/words` - Retrieve word list
- `POST /api/words` - Create new word
- `GET /api/groups` - Get study groups
- `POST /api/study-sessions` - Record study session

### YouTube Learning Endpoints
- `POST /api/get_transcript` - Extract video transcript
- `POST /api/split_transcript` - Split into sections
- `POST /api/structure_section` - Generate JLPT questions
- `POST /api/index_questions` - Store in vector database
- `POST /api/generate_question_from_conversation` - Create new questions


## 🚧 Development Roadmap

### Phase 1 (Current) ✅
- [x] Core word and group management
- [x] Study activities and sessions
- [x] Basic statistics dashboard
- [x] YouTube transcript processing
- [x] AI question generation


## 🤝 Contributing

### Development Guidelines
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Standards
- **Python**: PEP 8 compliance
- **TypeScript**: Strict type checking
- **React**: Functional components with hooks
- **Testing**: Minimum 80% coverage

## 🙏 Acknowledgments

- **JLPT**: Japanese Language Proficiency Test materials
- **OpenAI/Groq**: AI language model integration
- **ChromaDB**: Vector database for semantic search
- **React Community**: Frontend framework and ecosystem
- **Flask Community**: Python web framework



**Made with ❤️ for Japanese language learners worldwide**

*Study smart, learn efficiently, master Japanese!* 🇯🇵✨ 
