from fastapi import FastAPI

app = FastAPI(title="Payment Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "payment-service"}

@app.post("/api/payments")
def process_payment():
    return {"status": "success", "transaction_id": "TXN-12345"}
