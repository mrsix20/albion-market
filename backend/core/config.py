from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Albion Market Analyzer"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Albion API Base URL (Europe Server)
    AODP_BASE_URL: str = "https://europe.albion-online-data.com/api/v2/stats"
    
    # Tax configurations (Default values for Premium)
    PREMIUM_TAX_RATE: float = 0.04 # 4% tax for direct selling with Premium
    SETUP_FEE_RATE: float = 0.025 # 2.5% setup fee for market orders limit
    
    class Config:
        env_file = ".env"

settings = Settings()
