from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


DATABASE_URL = (
    f"postgresql+psycopg://{settings.db_user}:"
    f"{settings.db_password}@{settings.db_host}:"
    f"{settings.db_port}/{settings.db_name}"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass
