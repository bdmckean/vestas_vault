"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    database_url: str
    environment: str = "development"
    debug: bool = False
    log_level: str | None = (
        None  # e.g. DEBUG, INFO, WARNING, ERROR; default INFO (or DEBUG when debug=True)
    )
    api_v1_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
