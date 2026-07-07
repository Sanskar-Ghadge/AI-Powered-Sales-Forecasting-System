from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    days: int = Field(..., gt=0, description="Number of days to forecast")