from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from models.base import Base

DATABASE_URL = "sqlite:///./foodpilot.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    # SQLite ships with FK enforcement off; without this, ON DELETE SET NULL
    # on feeding_log.schedule_id is ignored.
    dbapi_connection.execute("PRAGMA foreign_keys=ON")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import models.feeding  # noqa: F401 – registers models
    Base.metadata.create_all(bind=engine)
