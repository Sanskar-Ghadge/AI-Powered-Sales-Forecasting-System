import os
import shutil
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from ml.linear_regression import preprocess_data, train_model, predict_future, get_model_metrics


# Global variables to hold trained model and data
trained_model = None
last_date = None
processed_df = None   # the cleaned DataFrame after preprocessing
raw_data_df = None    # the raw DataFrame before complex preprocessing


def aggregate_data(df: pd.DataFrame, period: str) -> pd.DataFrame:
    """
    Aggregates sales data by the specified period.
    period: 'daily', 'weekly', 'monthly'
    """
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'], format="mixed", dayfirst=True, errors='coerce')
    df = df.sort_values('date')

    if period == "weekly":
        df = df.set_index('date').resample('W').sum().reset_index()
    elif period == "monthly":
        df = df.set_index('date').resample('M').sum().reset_index()
    # If period is 'daily', do nothing

    return df


def handle_upload(file, period: str = "daily") -> Dict[str, Any]:
    """
    Saves uploaded file, optionally aggregates data, preprocesses,
    trains model, and returns historical data + metrics.
    """
    global trained_model, last_date, processed_df, raw_data_df

    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)

    # Save file to uploads/
    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Read the raw CSV (we need to aggregate before preprocessing)
        raw_df = pd.read_csv(file_path)
        has_product = 'product' in raw_df.columns
        if 'date' not in raw_df.columns or 'sales' not in raw_df.columns:
            raise Exception("CSV must contain 'date' and 'sales' columns")

        # Apply aggregation if needed
        raw_df = aggregate_data(raw_df, period)
        raw_data_df = raw_df.copy()

        # Preprocess data (feature engineering, lags, etc.)
        product_models = {}

        if 'product' in raw_df.columns:
            for product in raw_df['product'].unique():
                df_product = raw_df[raw_df['product'] == product]

                df_clean = preprocess_data(df_product)

                model, r2 = train_model(df_clean)

                product_models[product] = {
                    "model": model,
                    "data": df_clean
                }

            trained_model = product_models
        else:
            df = preprocess_data(raw_df)
            model, r2 = train_model(df)
            trained_model = model

        # Store globally
        if 'product' in raw_df.columns:
            # pick one product just for reference date
            sample_product = list(product_models.values())[0]
            processed_df = sample_product["data"]
            last_date = processed_df['date'].iloc[-1]
        else:
            processed_df = df
            last_date = df['date'].iloc[-1]

        # Historical sales list (already aggregated)
        if 'product' in raw_df.columns:
            sample_df = list(product_models.values())[0]["data"]
        else:
            sample_df = df

        historical = [
            {"date": str(row['date']), "sales": float(row['sales'])}
            for _, row in sample_df.iterrows()
        ]

        # Get metrics
        if has_product:
            accuracies = []

            for product, obj in product_models.items():
                print(f"{product} before dropna:", len(obj["data"]))
                df_temp = obj["data"]
                model_temp = obj["model"]

                # ✅ Ensure enough data
                if len(df_temp) < 5:
                    continue

                # ✅ Drop NaN rows (important for lag features)
                df_temp = df_temp.dropna()
                print(f"{product} after dropna:", len(df_temp))

                try:
                    y_true = df_temp['sales'].values[-10:]

                    X_temp = df_temp[['day', 'month', 'day_of_week', 'trend', 'lag1', 'lag7', 'rolling_mean_3', 'rolling_mean_7']].values[-10:]

                    y_pred = model_temp.predict(X_temp)

                    mae = np.mean(np.abs(y_true - y_pred))

                    if np.mean(y_true) != 0:
                        acc = 100 - (mae / np.mean(y_true)) * 100
                        accuracies.append(acc)

                except Exception as e:
                    print(f"Error in product {product}: {e}")

            print("Accuracies:", accuracies)
            if accuracies:
                avg_accuracy = np.mean(accuracies)
            else:
                avg_accuracy = None

            # ✅ Calculate growth & volatility using combined data
            all_sales = raw_df['sales'].values

            # Growth rate
            first_sales = np.mean(all_sales[:10])
            last_sales = np.mean(all_sales[-10:])

            if first_sales != 0:
                growth_rate = ((last_sales - first_sales) / first_sales) * 100
            else:
                growth_rate = 0

            # Volatility
            volatility = np.std(all_sales)

            metrics = {
                "accuracy": float(round(avg_accuracy, 2)) if avg_accuracy is not None else "Not enough data",
                "growth_rate": f"{growth_rate:.2f}%",
                "volatility": f"{volatility:.2f}",
                "ai_guidance": ["Multiple product models used"]
            }
        else:
            metrics = get_model_metrics(df, model, r2)

        # 🔥 Group product-wise sales
        product_sales = None
        if has_product:
            product_sales = {str(k): float(v) for k, v in raw_df.groupby('product')['sales'].sum().to_dict().items()}

        total_sales = float(raw_df['sales'].sum())
        total_days = int(raw_df['date'].nunique())

        return {
            "historical": historical,
            "model_details": metrics,
            "product_sales": product_sales,
            "total_sales": float(round(total_sales, 2)),
            "total_days": total_days,
            "has_product": has_product
        }
    except Exception as e:
        # If any error occurs, clean up the saved file and re-raise
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e


def handle_prediction(days: int) -> Dict[str, Any]:
    global trained_model, last_date, processed_df

    if trained_model is None or processed_df is None:
        return {"error": "Model not trained yet."}

    # ✅ Calculate total prediction and product-level predictions efficiently
    if isinstance(trained_model, dict):
        product_predictions = {}
        all_values = []

        # ✅ Use ONLY ONE product for graph (important fix)
        first_product = list(trained_model.values())[0]

        model = first_product["model"]
        df = first_product["data"]

        forecast = predict_future(model, df, days)

        # ✅ Still calculate per-product predictions
        for product, obj in trained_model.items():
            pred = predict_future(obj["model"], obj["data"], days)
            values = [p['value'] for p in pred]

            all_values.extend(values)

            avg_pred = sum(values) / len(values)
            product_predictions[product] = round(avg_pred, 2)

        total_prediction = round(sum(all_values), 2)

    else:
        forecast = predict_future(trained_model, processed_df, days)
        values = [p['value'] for p in forecast]
        total_prediction = round(sum(values), 2)
        product_predictions = None

    return {
        "forecast": forecast,
        "product_predictions": product_predictions,
        "total_prediction": total_prediction
    }


def get_aggregated_sales(period: str) -> Dict[str, Any]:
    """
    Returns aggregated sales for daily, weekly, or monthly periods.
    period: 'D' (day), 'W' (week), 'M' (month)
    """
    if processed_df is None:
        return {"error": "No data available. Please upload a CSV first."}

    # Copy to avoid modifying original
    df_agg = processed_df.set_index('date')['sales'].copy()
    # Resample based on period
    rule_map = {'D': 'D', 'W': 'W', 'M': 'M'}
    rule = rule_map.get(period)
    if rule is None:
        return {"error": "Invalid period. Use 'D', 'W', or 'M'."}

    aggregated = df_agg.resample(rule).sum().dropna()
    return {
        "period": period,
        "dates": aggregated.index.strftime("%Y-%m-%d").tolist(),
        "sales": aggregated.tolist()
    }