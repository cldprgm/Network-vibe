import requests

from django.conf import settings

from rest_framework.exceptions import ValidationError


GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'


def get_google_tokens(code: str) -> dict:
    """Exchange code for tokens"""
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH2_SECRET_ID,
        "redirect_uri": settings.GOOGLE_OAUTH2_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    try:
        response = requests.post(GOOGLE_TOKEN_URL, data=token_data)
        response.raise_for_status()

        tokens = response.json()
        if not tokens.get('id_token'):
            raise ValidationError("No ID token provided")

        return tokens
    except requests.exceptions.RequestException:
        raise ValidationError("Failed to exchange code with Google")
