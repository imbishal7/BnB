from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = "sqlite:///./bnb.db"
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    
    # n8n Webhooks
    n8n_media_generation_webhook: str
    n8n_ebay_publish_webhook: str
    
    # eBay API
    ebay_client_id: str = ""
    ebay_client_secret: str = ""
    ebay_sandbox: str = "true"
    
    # Backend URL
    backend_url: str = "http://localhost:8000"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Convert comma-separated CORS origins to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
