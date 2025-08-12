#!/usr/bin/env python3
"""
Database table creation script.
Run this script to create all database tables.
"""

import logging
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the app
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.exc import DatabaseError, OperationalError
from app.database import Base, engine, check_database_connection
from app import models  # Import all models to register them
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("database_setup.log") if settings.DEBUG else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_tables():
    """Create all database tables"""
    logger.info("Starting database table creation...")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    
    try:
        # Check database connection first
        if not check_database_connection():
            raise Exception("Cannot connect to database")
        
        logger.info("Database connection successful")
        
        # Create all tables
        logger.info("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        inspector = engine.dialect.get_table_names(engine.connect())
        expected_tables = ['users', 'questions', 'answers', 'stars']
        
        created_tables = []
        for table in expected_tables:
            if table in inspector:
                created_tables.append(table)
                logger.info(f"✓ Table '{table}' created successfully")
            else:
                logger.warning(f"✗ Table '{table}' was not created")
        
        if len(created_tables) == len(expected_tables):
            logger.info("🎉 All tables created successfully!")
            return True
        else:
            logger.error(f"Only {len(created_tables)}/{len(expected_tables)} tables were created")
            return False
            
    except OperationalError as e:
        logger.error(f"Database operational error: {str(e)}")
        logger.error("Check your database configuration and ensure the database server is running")
        return False
    except DatabaseError as e:
        logger.error(f"Database error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False

def main():
    """Main function"""
    logger.info("=" * 50)
    logger.info("Database Table Creation Script")
    logger.info("=" * 50)
    
    success = create_tables()
    
    if success:
        logger.info("Database setup completed successfully!")
        sys.exit(0)
    else:
        logger.error("Database setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()