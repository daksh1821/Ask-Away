from app import crud, database, schemas
db = next(database.get_db())

# create sample user if not exists
if not crud.get_user_by_username(db, "alice"):
    u = schemas.UserCreate(username="alice", email="alice@example.com", password="password", interests="python,fastapi", work_area="student")
    crud.create_user(db, u)

# create questions if not exist
qs = crud.list_questions(db, skip=0, limit=10)
if not qs:
    crud.create_question(db, 1, schemas.QuestionCreate(title="What is FastAPI?", content="FastAPI basics", tags="fastapi,python"))
    crud.create_question(db, 1, schemas.QuestionCreate(title="How to store embeddings?", content="Storage options for vectors", tags="ml,embeddings"))
    print("seed done")
else:
    print("seed already exists")
