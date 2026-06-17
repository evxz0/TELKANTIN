import os
import strawberry
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from strawberry.fastapi import GraphQLRouter


from db import get_db_connection, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):

    init_db()
    yield


@strawberry.type
class Order:
    id: int
    user_id: int
    merchant_id: str
    total_amount: float
    status: str
    payment_status: str


def map_row_to_order(row: dict) -> Order:
    return Order(
        id=row["id"],
        user_id=row["user_id"],
        merchant_id=row["merchant_id"],
        total_amount=float(row["total_amount"]),
        status=row.get("status", "pending"),
        payment_status=row.get("payment_status", "unpaid")
    )


@strawberry.type
class Query:
    @strawberry.field
    def orders(self) -> List[Order]:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders")
                rows = cursor.fetchall()
                return [map_row_to_order(row) for row in rows]
        finally:
            conn.close()

    @strawberry.field
    def order(self, id: int) -> Optional[Order]:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (id,))
                row = cursor.fetchone()
                if row:
                    return map_row_to_order(row)
                return None
        finally:
            conn.close()


@strawberry.type
class Mutation:
    @strawberry.mutation
    def checkout(self, notes: str) -> str:

        return f"Checkout success with notes: {notes}"

    @strawberry.mutation
    def create_order(
        self,
        user_id: int,
        merchant_id: str,
        total_amount: float,
        status: str = "pending",
        payment_status: str = "unpaid"
    ) -> Order:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO orders (user_id, merchant_id, total_amount, status, payment_status) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, merchant_id, total_amount, status, payment_status)
                )
                order_id = cursor.lastrowid
                
                cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (order_id,))
                row = cursor.fetchone()
                return map_row_to_order(row)
        finally:
            conn.close()

    @strawberry.mutation
    def update_order(
        self,
        id: int,
        user_id: Optional[int] = None,
        merchant_id: Optional[str] = None,
        total_amount: Optional[float] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> Optional[Order]:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:

                cursor.execute("SELECT id FROM orders WHERE id = %s", (id,))
                if not cursor.fetchone():
                    return None
                

                updates = []
                params = []
                if user_id is not None:
                    updates.append("user_id = %s")
                    params.append(user_id)
                if merchant_id is not None:
                    updates.append("merchant_id = %s")
                    params.append(merchant_id)
                if total_amount is not None:
                    updates.append("total_amount = %s")
                    params.append(total_amount)
                if status is not None:
                    updates.append("status = %s")
                    params.append(status)
                if payment_status is not None:
                    updates.append("payment_status = %s")
                    params.append(payment_status)
                
                if updates:
                    query = f"UPDATE orders SET {', '.join(updates)} WHERE id = %s"
                    params.append(id)
                    cursor.execute(query, tuple(params))
                
                # Fetch and return updated order
                cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (id,))
                row = cursor.fetchone()
                return map_row_to_order(row)
        finally:
            conn.close()

    @strawberry.mutation
    def delete_order(self, id: int) -> bool:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM orders WHERE id = %s", (id,))
                if not cursor.fetchone():
                    return False
                
                cursor.execute("DELETE FROM orders WHERE id = %s", (id,))
                return True
        finally:
            conn.close()

# --- Setup GraphQL ---
schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)

# --- Pydantic Schema for FastAPI REST endpoints ---
class OrderCreateSchema(BaseModel):
    user_id: int
    merchant_id: str
    total_amount: float
    status: Optional[str] = "pending"
    payment_status: Optional[str] = "unpaid"

class OrderUpdateSchema(BaseModel):
    user_id: Optional[int] = None
    merchant_id: Optional[str] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None

class OrderResponseSchema(BaseModel):
    id: int
    user_id: int
    merchant_id: str
    total_amount: float
    status: str
    payment_status: str

    class Config:
        from_attributes = True

# --- Setup FastAPI ---
app = FastAPI(title="Order Service", lifespan=lifespan)

# CORS middleware for local development
cors_origins = os.getenv("CORS_ORIGIN", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST Endpoint: Health Check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "order-service"}

# REST Endpoint: Create Order
@app.post("/api/orders", response_model=OrderResponseSchema, status_code=201)
def create_order_rest(order_in: OrderCreateSchema):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO orders (user_id, merchant_id, total_amount, status, payment_status) VALUES (%s, %s, %s, %s, %s)",
                (order_in.user_id, order_in.merchant_id, order_in.total_amount, order_in.status, order_in.payment_status)
            )
            order_id = cursor.lastrowid
            
            cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (order_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=500, detail="Failed to create order")
            return row
    finally:
        conn.close()

# REST Endpoint: Read All Orders
@app.get("/api/orders", response_model=List[OrderResponseSchema])
def get_orders_rest():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders")
            rows = cursor.fetchall()
            return rows
    finally:
        conn.close()

# REST Endpoint: Read Single Order by ID
@app.get("/api/orders/{id}", response_model=OrderResponseSchema)
def get_order_rest(id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Order with ID {id} not found")
            return row
    finally:
        conn.close()

# REST Endpoint: Update Order by ID
@app.put("/api/orders/{id}", response_model=OrderResponseSchema)
def update_order_rest(id: int, order_in: OrderUpdateSchema):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if order exists
            cursor.execute("SELECT id FROM orders WHERE id = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Order with ID {id} not found")
            
            # Construct update columns dynamically
            updates = []
            params = []
            update_dict = order_in.dict(exclude_unset=True)
            for k, v in update_dict.items():
                updates.append(f"{k} = %s")
                params.append(v)
            
            if updates:
                query = f"UPDATE orders SET {', '.join(updates)} WHERE id = %s"
                params.append(id)
                cursor.execute(query, tuple(params))
            
            # Fetch updated row
            cursor.execute("SELECT id, user_id, merchant_id, total_amount, status, payment_status FROM orders WHERE id = %s", (id,))
            row = cursor.fetchone()
            return row
    finally:
        conn.close()

# REST Endpoint: Delete Order by ID
@app.delete("/api/orders/{id}")
def delete_order_rest(id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM orders WHERE id = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Order with ID {id} not found")
            
            cursor.execute("DELETE FROM orders WHERE id = %s", (id,))
            return {"message": f"Order {id} deleted successfully"}
    finally:
        conn.close()

# Include Strawberry GraphQL Router
app.include_router(graphql_app, prefix="/graphql")
