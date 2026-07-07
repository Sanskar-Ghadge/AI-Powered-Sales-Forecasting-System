import pandas as pd
import numpy as np

# 🔧 Config
start_date = "2023-01-01"
end_date = "2023-06-30"   # 6 months (VERY IMPORTANT)
products = {
    "Milk": 180,
    "Bread": 70,
    "Chips": 90,
    "Chocolate": 120,
    "Rice": 160,
    "Oil": 150,
    "Soap": 40,
    "Cold Drink": 60
}

dates = pd.date_range(start=start_date, end=end_date, freq='D')

data = []
np.random.seed(42)

for product, base in products.items():
    for i, date in enumerate(dates):

        # 📈 Trend (slow growth)
        trend = i * np.random.uniform(0.05, 0.2)

        # 📊 Weekly seasonality
        weekly = 10 * np.sin(2 * np.pi * i / 7)

        # 📅 Monthly seasonality
        monthly = 5 * np.sin(2 * np.pi * i / 30)

        # 🎉 Random spikes (simulate demand bursts)
        spike = 0
        if np.random.rand() < 0.05:
            spike = np.random.randint(10, 40)

        # 🔊 Noise (controlled)
        noise = np.random.normal(0, 3)

        sales = base + trend + weekly + monthly + spike + noise

        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "product": product,
            "sales": round(max(5, sales), 2)   # avoid very small values
        })

# Create DataFrame
df = pd.DataFrame(data)

# Save file
df.to_csv("advanced_sales_dataset.csv", index=False)

print("✅ Dataset generated: advanced_sales_dataset.csv")