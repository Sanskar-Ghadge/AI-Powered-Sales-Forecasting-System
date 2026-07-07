import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.metrics import r2_score
from sklearn.metrics import mean_absolute_error
from datetime import datetime, timedelta
import os

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Reads CSV, validates columns, converts date, handles missing values,
    creates time-based features, and adds lag and rolling mean features.
    """
    df = df.copy()

    # Ensure required columns exist
    if 'date' not in df.columns or 'sales' not in df.columns:
        raise ValueError("CSV must contain 'date' and 'sales' columns.")

    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'], format="mixed", dayfirst=True, errors='coerce')
    # Drop rows where date could not be parsed
    df = df.dropna(subset=['date'])
    

    # Sort by date
    df = df.sort_values('date').reset_index(drop=True)

    # Ensure sales is numeric
    df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
    # Drop rows with missing sales
    df = df.dropna(subset=['sales'])

    if len(df) == 0:
        raise ValueError("No valid data after cleaning.")

    # Feature engineering: time-based features
    df['day'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.dayofweek  # Monday=0, Sunday=6
    df['trend'] = np.arange(len(df))

    # Lag features (shift by 1 day only)
    df['lag1'] = df['sales'].shift(1)

    # Rolling mean (3-day window)
    df['rolling_mean_3'] = df['sales'].rolling(window=3).mean()

    df['lag7'] = df['sales'].shift(7)
    df['rolling_mean_7'] = df['sales'].rolling(window=7).mean()

    # Remove rows with NaN (first row will be NaN due to lag1, first 3 rows due to rolling_mean_3, etc.)
    df = df.dropna().reset_index(drop=True)

    if len(df) < 4:
        raise ValueError("Dataset must have at least 4 rows after preprocessing to include all features.")

    return df


from sklearn.model_selection import train_test_split

def train_model(df: pd.DataFrame):
    X = df[['day', 'month', 'day_of_week', 'trend', 'lag1', 'lag7', 'rolling_mean_3', 'rolling_mean_7']].values
    y = df['sales'].values

    # ✅ Train-test split (VERY IMPORTANT)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, shuffle=False
    )


    model = XGBRegressor(
      n_estimators=300,
      learning_rate=0.05,
      max_depth=7,
      subsample=0.8,
     colsample_bytree=0.8,
     random_state=42
    )  

    model.fit(X_train, y_train)

    # ✅ Calculate REAL accuracy
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)

        # Convert to percentage accuracy
    accuracy = max(0, 100 - (mae / (np.max(y_test) - np.min(y_test))) * 100)

    return model, accuracy


def predict_future(model, df: pd.DataFrame, days: int) -> list:
    """
    Generates future dates and predicts sales for the given number of days.
    Uses the last three actual/predicted sales for lags and rolling mean.
    """
    # Work on a copy to avoid modifying the original DataFrame
    df_pred = df.copy()
    predictions = []

    for i in range(days):
        # Last date in the current data
        last_date = df_pred['date'].max() + pd.Timedelta(days=1)

        # Features for the new day
        day = last_date.day
        month = last_date.month
        day_of_week = last_date.dayofweek

        # Get the last three sales values (for lag1 and rolling_mean_3)
        last_three = df_pred.tail(3)['sales'].values
        if len(last_three) < 3:
            raise ValueError("Insufficient data to compute lags.")
        lag1 = last_three[2]   # most recent
        # lag2 and lag3 are no longer used

        # Rolling mean of the last three sales
        rolling_mean_3 = np.mean(last_three)

        # Prepare input for prediction
        lag7 = df_pred.tail(7)['sales'].values[0] if len(df_pred) >= 7 else lag1
        rolling_mean_7 = df_pred.tail(7)['sales'].mean() if len(df_pred) >= 7 else rolling_mean_3
        trend = df_pred['trend'].iloc[-1] + 1

        X_pred = [[
           day,
           month,
           day_of_week,
           trend,
           lag1,
           lag7,
           rolling_mean_3,
           rolling_mean_7
        ]]
        # Get predictions from all trees (for confidence interval)
        pred = model.predict(X_pred)[0]

        # Simple confidence interval approximation
        lower = pred * 0.9
        upper = pred * 1.1

        predictions.append({
           "value": float(pred),
           "lower": float(lower),
           "upper": float(upper)
        })

        # Append the predicted row to the DataFrame for future iterations
        new_row = pd.DataFrame({
            'date': [last_date],
            'sales': [pred],
            'day': [day],
            'month': [month],
            'trend': [df_pred['trend'].iloc[-1] + 1],
            'day_of_week': [day_of_week],
            'lag1': [lag1],
            'rolling_mean_3': [rolling_mean_3],
        })
        df_pred = pd.concat([df_pred, new_row], ignore_index=True)

    return predictions


def get_model_metrics(df: pd.DataFrame, model, r2: float) -> dict:
    """
    Calculates R² score, growth rate, volatility, and generates simple AI guidance.
    """
    X = df[['day', 'month', 'day_of_week', 'trend', 'lag1', 'lag7', 'rolling_mean_3', 'rolling_mean_7']].values
    y = df['sales'].values

    # Growth rate (percentage from first to last sales)
    first_sales = np.mean(y[:10])
    last_sales = np.mean(y[-10:])
    if first_sales == 0:
        growth_rate = 0.0
    else:
        growth_rate = ((last_sales - first_sales) / first_sales) * 100

    # Volatility (standard deviation of sales)
    volatility = np.std(y)

    # AI guidance based on growth and volatility
    guidance = []
    if growth_rate > 10:
        guidance.append("Sales are increasing strongly – consider scaling up.")
    elif growth_rate > 0:
        guidance.append("Sales are growing steadily – maintain current strategy.")
    elif growth_rate < -10:
        guidance.append("Sales are declining sharply – investigate causes.")
    elif growth_rate < 0:
        guidance.append("Slight decline – review marketing or pricing.")
    else:
        guidance.append("Sales are stable – focus on consistency.")

    if volatility > np.mean(y) * 0.5:
        guidance.append("High volatility detected – consider promotions or inventory smoothing.")
    elif volatility < np.mean(y) * 0.1:
        guidance.append("Very stable sales – operational efficiency is high.")
    else:
        guidance.append("Moderate volatility – manage inventory with safety stock.")

    return {
        "accuracy": float(round(r2, 4)),
        "growth_rate": f"{growth_rate:.2f}%",
        "volatility": f"{volatility:.2f}",
        "ai_guidance": guidance
    }