import numpy as np
from ml.linear_regression import LinearRegressionScratch

# Dummy data
X = np.array([1,2,3,4,5])
y = np.array([100,200,300,400,500])

model = LinearRegressionScratch(lr=0.01, iterations=1000)
model.fit(X, y)

print("Slope:", model.m)
print("Intercept:", model.b)

prediction = model.predict(np.array([6]))
print("Prediction for 6:", prediction)