"""Data access layer (repositories)."""

from app.repositories.account_repository import AccountRepository
from app.repositories.social_security_repository import SocialSecurityRepository

__all__ = ["AccountRepository", "SocialSecurityRepository"]
