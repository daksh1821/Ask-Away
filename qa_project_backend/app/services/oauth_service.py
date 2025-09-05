from authlib.integrations.starlette_client import OAuth
from authlib.integrations.starlette_client import OAuthError
from starlette.requests import Request
from typing import Optional, Dict
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class OAuthService:
    def __init__(self):
        self.oauth = OAuth()
        
        if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
            self.oauth.register(
                name='google',
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
                client_kwargs={
                    'scope': 'openid email profile'
                }
            )
    
    async def get_google_auth_url(self, request: Request, redirect_uri: str) -> str:
        """Generate Google OAuth authorization URL"""
        try:
            google = self.oauth.create_client('google')
            return await google.authorize_redirect(request, redirect_uri)
        except Exception as e:
            logger.error(f"Google auth URL generation failed: {e}")
            raise
    
    async def handle_google_callback(self, request: Request) -> Optional[Dict]:
        """Handle Google OAuth callback and return user info"""
        try:
            google = self.oauth.create_client('google')
            token = await google.authorize_access_token(request)
            
            # Get user info
            user_info = token.get('userinfo')
            if user_info:
                return {
                    'email': user_info.get('email'),
                    'first_name': user_info.get('given_name', ''),
                    'last_name': user_info.get('family_name', ''),
                    'picture': user_info.get('picture'),
                    'google_id': user_info.get('sub')
                }
            return None
            
        except OAuthError as e:
            logger.error(f"Google OAuth callback failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected OAuth error: {e}")
            return None

# Global instance
oauth_service = OAuthService()