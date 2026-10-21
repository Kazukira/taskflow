from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_password: str
    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_name: str = "taskflow"
    db_user: str = "taskflow"

    jwt_secret_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
