from flask import request

def get_pagination_params():
    """Extract and validate pagination parameters from the request."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 100))
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 1000:
            per_page = 100
    except ValueError:
        page = 1
        per_page = 100
    
    return page, per_page 