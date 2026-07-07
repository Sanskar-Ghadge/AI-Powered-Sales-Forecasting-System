import subprocess
import json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import PredictRequest
from services.model_service import handle_upload, handle_prediction, get_aggregated_sales
from services.chat_service import handle_chat
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Sales Prediction Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # For production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi import Body

@app.post("/chat")
def chat(data: dict = Body(...)):
    return handle_chat(data["query"])

@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    period: str = Query("daily", regex="^(daily|weekly|monthly)$")
):
    """
    Upload a CSV file with 'date' and 'sales' columns.
    Optionally aggregate data by period (daily, weekly, monthly).
    Returns historical sales and model insights.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV.")

    # Validate period (already done by regex in Query)
    try:
        result = handle_upload(file, period)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict")
async def predict(predict_req: PredictRequest):
    """
    Predict future sales for a given number of days.
    Expects JSON: { "days": int }
    """
    result = handle_prediction(predict_req.days)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.get("/aggregate")
async def aggregate(period: str = Query(..., regex="^(D|W|M)$")):
    """
    Get aggregated sales for daily (D), weekly (W), or monthly (M) periods.
    """
    result = get_aggregated_sales(period)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.get("/")
async def root():
    return {"message": "AI Sales Prediction System is running."}

def run_c_program(executable, args):
    result = subprocess.run(
        [executable] + args,
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

@app.post("/ai/bfs-dfs")
def bfs_dfs(data: dict):
    return run_c_program(
        "./compiled/bfs_dfs",
        [str(data["source"]), str(data["destination"]), data["algorithm"]]
    )











# uvicorn main:app --reload