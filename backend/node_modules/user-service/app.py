import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import pymysql
import os

# --- Model & Logic ---
@strawberry.type
class User:
    id: int
    full_name: str
    email: str
    role: str

@strawberry.type
class Query:
    @strawberry.field
    def me(self) -> User:
        # Mock logic or simple DB query
        return User(id=1, full_name="Afif", email="afif@example.com", role="mahasiswa")

@strawberry.type
class Mutation:
    @strawberry.mutation
    def login(self, email: str, password: str) -> str:
        return "fake-jwt-token"

# --- Setup GraphQL ---
schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)

# --- Setup FastAPI ---
app = FastAPI(title="User Service")

# REST endpoint fallback/health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "user-service"}

app.include_router(graphql_app, prefix="/graphql")
