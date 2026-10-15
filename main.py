from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI(title="Roguelike Game")

# Mount static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve index.html at root
@app.get("/")
async def read_root():
    return StaticFiles(directory="static", html=True).get_response("index.html", None)

# API to get level data
@app.get("/api/level/{level_id}")
async def get_level(level_id: int):
    level_path = f"levels/level{level_id}.json"
    if not os.path.exists(level_path):
        return {"error": "Level not found"}
    with open(level_path, "r") as f:
        data = json.load(f)
    return data

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)