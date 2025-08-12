import logging
from app import crud, database, schemas

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = next(database.get_db())

try:
    # Create sample user if not exists
    if not crud.get_user_by_username(db, "alice"):
        u = schemas.UserCreate(
            username="alice",
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            password="password",
            interests="python,fastapi",
            work_area="student"
        )
        user = crud.create_user(db, u)
        logger.info("Created user: alice")
    else:
        user = crud.get_user_by_username(db, "alice")
        logger.info("User alice already exists")

    # Create questions if not exist
    qs = crud.list_questions(db, skip=0, limit=10)
    if not qs:
        crud.create_question(db, user.id, schemas.QuestionCreate(
            title="What is FastAPI?",
            content="FastAPI basics",
            tags="fastapi,python"
        ))
        crud.create_question(db, user.id, schemas.QuestionCreate(
            title="How to store embeddings?",
            content="Storage options for vectors",
            tags="ml,embeddings"
        ))
        logger.info("Seed questions created")
    else:
        logger.info("Seed questions already exist")

except Exception as e:
    logger.error(f"Error seeding data: {str(e)}")
    raise

finally:
    db.close()