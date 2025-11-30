import requests

from django.conf import settings

from rest_framework.exceptions import ValidationError


GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'


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


def get_github_tokens(code: str) -> dict:
    """Exchange code for tokens"""

    token_data = {
        "code": code,
        "client_id": settings.GITHUB_OAUTH2_CLIENT_ID,
        "client_secret": settings.GITHUB_OAUTH2_SECRET_ID,
        "redirect_uri": settings.GITHUB_OAUTH2_REDIRECT_URI,
    }
    headers = {"Accept": "application/json"}

    try:
        response = requests.post(
            GITHUB_TOKEN_URL,
            data=token_data,
            headers=headers
        )
        response.raise_for_status()

        token_res = response.json()
        if not token_res.get('access_token'):
            raise ValidationError("No access_token provided")

        return token_res
    except requests.exceptions.RequestException:
        raise ValidationError("Failed to exchange code with Github")
