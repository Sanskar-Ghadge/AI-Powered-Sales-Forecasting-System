import numpy as np


class MultiLinearRegressionScratch:
    def __init__(self, lr=0.001, n_iters=1000, lambda_param=0.01):
        self.lr = lr
        self.n_iters = n_iters
        self.lambda_param = lambda_param
        self.weights = None
        self.bias = 0
        self.n_samples = 0

    # 🔥 Feature Engineering (Trend + Seasonality)
    def _create_features(self, X):
        X_new = []
        for i in range(len(X)):
            x = X[i][0]  # day/index
            X_new.append([
                x,                     # trend
                np.sin(x / 7),         # weekly pattern
                np.cos(x / 7)          # smooth cycle
            ])
        return np.array(X_new)

    def fit(self, X, y):
        X = self._create_features(X)

        n_samples, n_features = X.shape
        self.n_samples = n_samples

        self.weights = np.zeros(n_features)
        self.bias = 0

        # Gradient Descent
        for _ in range(self.n_iters):
            y_pred = np.dot(X, self.weights) + self.bias

            dw = (1 / n_samples) * (
                np.dot(X.T, (y_pred - y)) + self.lambda_param * self.weights
            )
            db = (1 / n_samples) * np.sum(y_pred - y)

            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    # 🔥 Improved Prediction (Realistic Pattern)
    def predict(self, days):
        future_X = []

        start = self.n_samples  # continue from last day

        for i in range(days):
            x = start + i
            future_X.append([
                x,
                np.sin(x / 7),
                np.cos(x / 7)
            ])

        future_X = np.array(future_X)

        predictions = np.dot(future_X, self.weights) + self.bias

        # 🔥 Add slight randomness (real-world feel)
        noise = np.random.normal(0, 20, size=len(predictions))
        predictions = predictions + noise

        return predictions.tolist()