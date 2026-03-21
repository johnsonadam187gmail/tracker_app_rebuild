import secrets
from app.auth.config import CSRF_TOKEN_COOKIE_NAME, CSRF_HEADER_NAME


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf_token(request, token_from_cookie: str) -> bool:
    token_from_header = request.headers.get(CSRF_HEADER_NAME)
    if not token_from_header or not token_from_cookie:
        return False
    return secrets.compare_digest(token_from_header, token_from_cookie)
