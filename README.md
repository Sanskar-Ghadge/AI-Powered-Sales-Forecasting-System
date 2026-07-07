# AI Sales Forecasting System

A full-stack sales prediction dashboard. It combines a Vite/React frontend with a FastAPI backend to train product-wise XGBoost models and forecast future sales. It also includes a conversational chat assistant powered by Gemini (using the Google GenAI SDK) to query dataset metrics.

## Tech Stack

* **Frontend**: React 19, Vite, Recharts, Framer Motion, Tailwind CSS
* **Backend**: FastAPI, Python 3.10+, XGBoost, Pandas, Scikit-Learn
* **LLM Integration**: Google GenAI SDK (Gemini 2.5 Flash)

---

## Key Features

1. **Auto-Regressive Forecasting**: Uses XGBoost for time-series forecasting. The model engineers features dynamically (lag values, rolling averages, and calendar components) to predict future sales step-by-step.
2. **Multi-Product Modeling**: If the uploaded CSV contains a `product` column, the backend automatically partitions the data and trains a separate ML model for each product.
3. **Data Aggregation**: Supports daily, weekly, or monthly resampling during file upload.
4. **Conversational Assistant**: A floating chat widget powered by Gemini allows users to query sales numbers in plain language. If the Gemini API key is missing or offline, it falls back to a regex-based statistics engine.

---

## Project Structure

```text
├── backend/
│   ├── ml/                 # XGBoost and scratch regression models
│   ├── services/           # Business logic (Gemini chat and model training)
│   ├── main.py             # FastAPI endpoints
│   └── models.py           # Pydantic schemas
└── frontend/
    ├── src/
    │   ├── pages/          # Home, Dashboard, and Login pages
    │   ├── App.jsx         # App router
    │   └── main.jsx        # Entry point
    └── package.json
```

---

## Setup & Installation

### 1. Backend Setup
Navigate to the `backend` directory and set up a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The server will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup
Navigate to the `frontend` directory, install dependencies, and start the development server:

```bash
cd ../frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## CSV Dataset Requirements

To train the models correctly, files uploaded to the dashboard must be in CSV format and contain the following column names:
* `date`: Format should be parseable (e.g., `YYYY-MM-DD`).
* `sales`: Numerical values representing revenue or units sold.
* `product` *(Optional)*: String name. If present, product-level metrics and forecasts will be generated.
