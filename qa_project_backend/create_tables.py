import logging
from sqlalchemy.exc import DatabaseError
from app.database import Base, engine
from app import models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully")
    except DatabaseError as e:
        logger.error(f"Error creating tables: {str(e)}")
        raise