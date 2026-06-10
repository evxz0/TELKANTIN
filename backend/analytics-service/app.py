from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Analytics Service")

class SalesEvent(BaseModel):
    menu_id: int
    quantity: int
    price: float

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "analytics-service"}

@app.get("/api/analytics/sales")
def get_sales_analytics():
    return {"total_revenue": 500000.0, "top_menu": "Nasi Goreng"}

@app.post("/api/analytics/track-sale")
def track_sale(event: SalesEvent):
    revenue = event.quantity * event.price
    return {"message": "Sale tracked successfully", "revenue_added": revenue}
