# Japanese Learning API

A Flask-based API for Japanese language learning application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

## Testing

Run tests using pytest:
```bash
python -m pytest test_app.py -v
```

## API Endpoints

- `GET /`: Welcome message
- `GET /api/test`: Test endpoint
- `GET /api/test-db`: Test database connection
- `GET /api/study-activities`: Get all study activities
- `GET /api/study-activities/<id>`: Get a specific study activity by ID 