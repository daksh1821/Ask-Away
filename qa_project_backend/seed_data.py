#!/usr/bin/env python3
"""
Database seeding script.
Run this script to populate the database with sample data.
"""

import logging
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the app
sys.path.append(str(Path(__file__).parent))

from app import crud, database, schemas, models
from app.database import engine, Base
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("seed_data.log") if settings.DEBUG else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database tables"""
    logger.info("Creating database tables...")
    try:
        # Drop all tables and recreate them (fresh start)
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        
        # Print created tables
        logger.info("Created tables:")
        for table_name in Base.metadata.tables.keys():
            logger.info(f"  - {table_name}")
            
    except Exception as e:
        logger.error(f"❌ Error creating database: {e}")
        raise e

def create_sample_users(db):
    """Create sample users"""
    logger.info("Creating sample users...")
    
    users_data = [
        {
            "username": "alice",
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com",
            "password": "password123",
            "interests": "python,fastapi,web development",
            "work_area": "Software Engineer"
        },
        {
            "username": "bob",
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob@example.com",
            "password": "password123",
            "interests": "machine learning,data science,python",
            "work_area": "Data Scientist"
        },
        {
            "username": "charlie",
            "first_name": "Charlie",
            "last_name": "Brown",
            "email": "charlie@example.com",
            "password": "password123",
            "interests": "javascript,react,frontend",
            "work_area": "Frontend Developer"
        },
        {
            "username": "diana",
            "first_name": "Diana",
            "last_name": "Prince",
            "email": "diana@example.com",
            "password": "password123",
            "interests": "devops,cloud,aws,docker",
            "work_area": "DevOps Engineer"
        },
        {
            "username": "eve",
            "first_name": "Eve",
            "last_name": "Davis",
            "email": "eve@example.com",
            "password": "password123",
            "interests": "ui/ux,design,figma",
            "work_area": "UX Designer"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        try:
            existing_user = crud.get_user_by_username(db, user_data["username"])
            if not existing_user:
                user_create = schemas.UserCreate(**user_data)
                user = crud.create_user(db, user_create)
                created_users.append(user)
                logger.info(f"✓ Created user: {user.username}")
            else:
                created_users.append(existing_user)
                logger.info(f"User {user_data['username']} already exists")
        except Exception as e:
            logger.error(f"Failed to create user {user_data['username']}: {e}")
    
    return created_users

def create_sample_questions(db, users):
    """Create sample questions"""
    logger.info("Creating sample questions...")
    
    questions_data = [
        {
            "title": "How to get started with FastAPI?",
            "content": "I'm new to FastAPI and want to build a REST API. What are the best practices for getting started? Should I use async/await everywhere?",
            "tags": "fastapi,python,rest-api,beginner",
            "user_index": 0  # Alice
        },
        {
            "title": "Best practices for database migrations in SQLAlchemy",
            "content": "I'm working on a project using SQLAlchemy and need to handle database schema changes. What are the best practices for migrations? Should I use Alembic?",
            "tags": "sqlalchemy,database,migrations,alembic",
            "user_index": 1  # Bob
        },
        {
            "title": "React state management: Context vs Redux",
            "content": "For a medium-sized React application, should I use React Context or Redux for state management? What are the pros and cons of each approach?",
            "tags": "react,state-management,redux,context",
            "user_index": 2  # Charlie
        },
        {
            "title": "Docker best practices for Python applications",
            "content": "What are the best practices for dockerizing Python applications? How should I structure my Dockerfile and docker-compose.yml for development vs production?",
            "tags": "docker,python,containerization,devops",
            "user_index": 3  # Diana
        },
        {
            "title": "How to implement user authentication with JWT?",
            "content": "I need to implement user authentication in my web application using JWT tokens. What's the proper way to handle token storage and refresh?",
            "tags": "authentication,jwt,security,web-development",
            "user_index": 0  # Alice
        },
        {
            "title": "Machine Learning model deployment strategies",
            "content": "What are the different ways to deploy ML models in production? Should I use Flask, FastAPI, or something else? What about scaling?",
            "tags": "machine-learning,deployment,flask,fastapi,production",
            "user_index": 1  # Bob
        },
        {
            "title": "CSS Grid vs Flexbox: When to use which?",
            "content": "I'm always confused about when to use CSS Grid versus Flexbox. Can someone explain the differences and provide examples of when each is better?",
            "tags": "css,grid,flexbox,layout,frontend",
            "user_index": 4  # Eve
        }
    ]
    
    created_questions = []
    for question_data in questions_data:
        try:
            user = users[question_data["user_index"]]
            question_create = schemas.QuestionCreate(
                title=question_data["title"],
                content=question_data["content"],
                tags=question_data["tags"]
            )
            question = crud.create_question(db, user.id, question_create)
            created_questions.append(question)
            logger.info(f"✓ Created question: {question.title[:50]}...")
        except Exception as e:
            logger.error(f"Failed to create question: {e}")
    
    return created_questions

def create_sample_answers(db, questions, users):
    """Create sample answers"""
    logger.info("Creating sample answers...")
    
    answers_data = [
        # Answers for "How to get started with FastAPI?"
        {
            "question_index": 0,
            "user_index": 1,  # Bob answers Alice's question
            "content": "FastAPI is excellent for beginners! Start with the official tutorial. You don't need async/await everywhere - only use it for I/O operations like database queries or API calls. For CPU-bound tasks, regular functions work fine."
        },
        {
            "question_index": 0,
            "user_index": 3,  # Diana also answers
            "content": "I'd recommend starting with a simple CRUD app. Use Pydantic for data validation, SQLAlchemy for database operations, and definitely check out the automatic API documentation at /docs endpoint!"
        },
        
        # Answers for "Best practices for database migrations"
        {
            "question_index": 1,
            "user_index": 0,  # Alice answers Bob's question
            "content": "Alembic is definitely the way to go for SQLAlchemy migrations. Always review auto-generated migrations before applying them, and make sure to backup your database before running migrations in production."
        },
        
        # Answers for "React state management"
        {
            "question_index": 2,
            "user_index": 0,  # Alice
            "content": "For medium-sized apps, React Context is usually sufficient and simpler to implement. Redux adds complexity but gives you better debugging tools and predictable state updates. Consider the team's experience and project requirements."
        },
        {
            "question_index": 2,
            "user_index": 4,  # Eve
            "content": "From a UX perspective, Context works great for global themes, user preferences, etc. Redux shines when you need complex state logic or when multiple components need to update the same state frequently."
        },
        
        # Answers for "Docker best practices"
        {
            "question_index": 3,
            "user_index": 1,  # Bob
            "content": "Use multi-stage builds, keep your images small by using alpine variants, and don't run as root. For Python apps, use .dockerignore to exclude unnecessary files and leverage Docker layer caching."
        },
        
        # Answers for "JWT authentication"
        {
            "question_index": 4,
            "user_index": 2,  # Charlie
            "content": "Store JWT tokens in httpOnly cookies for better security, not localStorage. Implement refresh tokens with shorter-lived access tokens. Always validate tokens on the server side and consider using a proper auth library."
        },
        
        # Answers for "ML model deployment"
        {
            "question_index": 5,
            "user_index": 3,  # Diana
            "content": "FastAPI is great for ML model APIs due to its async support and automatic docs. For scaling, consider using Docker containers with Kubernetes or cloud services like AWS Lambda for serverless deployment."
        },
        
        # Answers for "CSS Grid vs Flexbox"
        {
            "question_index": 6,
            "user_index": 2,  # Charlie
            "content": "Use Flexbox for one-dimensional layouts (rows or columns) and CSS Grid for two-dimensional layouts. Flexbox is perfect for navigation bars, while Grid excels at complex page layouts with multiple rows and columns."
        }
    ]
    
    created_answers = []
    for answer_data in answers_data:
        try:
            question = questions[answer_data["question_index"]]
            user = users[answer_data["user_index"]]
            answer_create = schemas.AnswerCreate(content=answer_data["content"])
            answer = crud.create_answer(db, user.id, question.id, answer_create)
            created_answers.append(answer)
            logger.info(f"✓ Created answer by {user.username} for question: {question.title[:30]}...")
        except Exception as e:
            logger.error(f"Failed to create answer: {e}")
    
    return created_answers

def create_sample_stars(db, questions, answers, users):
    """Create sample stars (users starring answers)"""
    logger.info("Creating sample stars...")
    
    # Star some answers (users can't star their own answers)
    stars_data = [
        {"user_index": 0, "answer_index": 2},  # Alice stars Bob's answer
        {"user_index": 2, "answer_index": 0},  # Charlie stars Bob's answer
        {"user_index": 3, "answer_index": 0},  # Diana stars Bob's answer
        {"user_index": 1, "answer_index": 3},  # Bob stars Alice's answer
        {"user_index": 4, "answer_index": 6},  # Eve stars Charlie's answer
        {"user_index": 0, "answer_index": 5},  # Alice stars Diana's answer
    ]
    
    created_stars = []
    for star_data in stars_data:
        try:
            user = users[star_data["user_index"]]
            answer = answers[star_data["answer_index"]]
            
            # Find the question for this answer
            question = next(q for q in questions if q.id == answer.question_id)
            
            # Don't allow users to star their own answers
            if answer.user_id != user.id:
                star = crud.star_answer(db, user.id, question.id, answer.id)
                created_stars.append(star)
                logger.info(f"✓ {user.username} starred answer by user_id {answer.user_id}")
        except Exception as e:
            logger.info(f"Star creation skipped or failed: {e}")
    
    return created_stars

def main():
    """Main seeding function"""
    logger.info("🌱 Starting database seeding...")
    
    try:
        # Initialize database tables
        init_database()
        
        # Get database session
        db = next(database.get_db())
        
        # Create sample data
        users = create_sample_users(db)
        logger.info(f"Created {len(users)} users")
        
        questions = create_sample_questions(db, users)
        logger.info(f"Created {len(questions)} questions")
        
        answers = create_sample_answers(db, questions, users)
        logger.info(f"Created {len(answers)} answers")
        
        stars = create_sample_stars(db, questions, answers, users)
        logger.info(f"Created {len(stars)} stars")
        
        logger.info("🎉 Database seeding completed successfully!")
        logger.info(f"Summary:")
        logger.info(f"  - {len(users)} users")
        logger.info(f"  - {len(questions)} questions")
        logger.info(f"  - {len(answers)} answers")
        logger.info(f"  - {len(stars)} stars")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()