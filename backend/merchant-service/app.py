from fastapi import FastAPI

app = FastAPI(title="Merchant Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "merchant-service"}

@app.get("/api/merchants")
def get_merchants():
    return [{"id": 1, "name": "Kantin Bu Piah"}, {"id": 2, "name": "Kantin Pak Bejo"}]
