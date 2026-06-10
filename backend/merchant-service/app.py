from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Merchant Service")

class MerchantCreate(BaseModel):
    name: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "merchant-service"}

@app.get("/api/merchants")
def get_merchants():
    return [{"id": 1, "name": "Kantin Bu Piah"}, {"id": 2, "name": "Kantin Pak Bejo"}]

@app.post("/api/merchants")
def create_merchant(merchant: MerchantCreate):
    return {"id": 3, "name": merchant.name, "message": "Merchant created successfully"}
