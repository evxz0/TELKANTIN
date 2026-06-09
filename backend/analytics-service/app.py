from fastapi import FastAPI

app = FastAPI(title="Analytics Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "analytics-service"}

@app.get("/api/analytics/sales")
def get_sales_analytics():
    return {"total_revenue": 500000.0, "top_menu": "Nasi Goreng"}
