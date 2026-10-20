import uvicorn
from fastapi import FastAPI


app = FastAPI(title="server")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("application.__main__:app", host="0.0.0.0", port=8080)