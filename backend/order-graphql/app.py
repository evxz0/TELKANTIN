import os
import strawberry
import httpx
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

# ── Konfigurasi URL Order Service ─────────────────────────────────────
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:3003")


# ── FastAPI Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inisialisasi httpx async client
    app.state.http_client = httpx.AsyncClient(base_url=ORDER_SERVICE_URL, timeout=30.0)
    yield
    await app.state.http_client.aclose()


# ── Strawberry GraphQL Types ─────────────────────────────────────────
@strawberry.type
class Order:
    id: int
    user_id: int
    merchant_id: str
    total_amount: float
    status: str
    payment_status: str


def map_dict_to_order(data: dict) -> Order:
    return Order(
        id=data["id"],
        user_id=data["user_id"],
        merchant_id=data["merchant_id"],
        total_amount=float(data["total_amount"]),
        status=data.get("status", "pending"),
        payment_status=data.get("payment_status", "unpaid"),
    )


# ── GraphQL Query ─────────────────────────────────────────────────────
@strawberry.type
class Query:
    @strawberry.field
    async def orders(self, info: strawberry.types.Info) -> List[Order]:
        """Mengambil semua data order melalui Order Service REST API"""
        client: httpx.AsyncClient = info.context["request"].app.state.http_client
        response = await client.get("/api/orders")
        response.raise_for_status()
        rows = response.json()
        return [map_dict_to_order(row) for row in rows]

    @strawberry.field
    async def order(self, id: int, info: strawberry.types.Info) -> Optional[Order]:
        """Mengambil data order berdasarkan ID melalui Order Service REST API"""
        client: httpx.AsyncClient = info.context["request"].app.state.http_client
        response = await client.get(f"/api/orders/{id}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        row = response.json()
        return map_dict_to_order(row)


# ── GraphQL Mutation ──────────────────────────────────────────────────
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_order(
        self,
        user_id: int,
        merchant_id: str,
        total_amount: float,
        info: strawberry.types.Info,
        status: str = "pending",
        payment_status: str = "unpaid",
    ) -> Order:
        """Membuat order baru melalui Order Service REST API"""
        client: httpx.AsyncClient = info.context["request"].app.state.http_client
        payload = {
            "user_id": user_id,
            "merchant_id": merchant_id,
            "total_amount": total_amount,
            "status": status,
            "payment_status": payment_status,
        }
        response = await client.post("/api/orders", json=payload)
        response.raise_for_status()
        row = response.json()
        return map_dict_to_order(row)

    @strawberry.mutation
    async def update_order(
        self,
        id: int,
        info: strawberry.types.Info,
        user_id: Optional[int] = None,
        merchant_id: Optional[str] = None,
        total_amount: Optional[float] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
    ) -> Optional[Order]:
        """Memperbarui order berdasarkan ID melalui Order Service REST API"""
        client: httpx.AsyncClient = info.context["request"].app.state.http_client
        payload = {}
        if user_id is not None:
            payload["user_id"] = user_id
        if merchant_id is not None:
            payload["merchant_id"] = merchant_id
        if total_amount is not None:
            payload["total_amount"] = total_amount
        if status is not None:
            payload["status"] = status
        if payment_status is not None:
            payload["payment_status"] = payment_status

        response = await client.put(f"/api/orders/{id}", json=payload)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        row = response.json()
        return map_dict_to_order(row)

    @strawberry.mutation
    async def delete_order(self, id: int, info: strawberry.types.Info) -> bool:
        """Menghapus order berdasarkan ID melalui Order Service REST API"""
        client: httpx.AsyncClient = info.context["request"].app.state.http_client
        response = await client.delete(f"/api/orders/{id}")
        if response.status_code == 404:
            return False
        response.raise_for_status()
        return True

    @strawberry.mutation
    def checkout(self, notes: str) -> str:
        """Proses checkout dengan catatan"""
        return f"Checkout success with notes: {notes}"


# ── Setup GraphQL & FastAPI ───────────────────────────────────────────
schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)

app = FastAPI(title="Order GraphQL", lifespan=lifespan)

# CORS middleware
cors_origins = os.getenv("CORS_ORIGIN", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "order-graphql",
        "proxied_to": ORDER_SERVICE_URL,
    }

# Mount GraphQL Router
app.include_router(graphql_app, prefix="/graphql")
