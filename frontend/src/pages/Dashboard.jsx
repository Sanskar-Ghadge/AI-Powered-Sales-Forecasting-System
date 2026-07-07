import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [productPredictions, setProductPredictions] = useState(null);
  const [hasProduct, setHasProduct] = useState(false);
  const [productSales, setProductSales] = useState(null);
  const [totalSales, setTotalSales] = useState(null);
  const [totalPrediction, setTotalPrediction] = useState(null);
  const [forecastSummary, setForecastSummary] = useState(null);
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [modelDetails, setModelDetails] = useState(null);
  const [days, setDays] = useState(30);
  const [period, setPeriod] = useState("daily");
  const [isUploading, setIsUploading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // --- CHAT STATE (added) ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // Prepare accuracy display string
  const accuracyDisplay = modelDetails?.accuracy !== undefined
    ? typeof modelDetails.accuracy === "number"
      ? `${modelDetails.accuracy.toFixed(2)}%`
      : modelDetails.accuracy
    : "Calculating...";

  // --- CHAT HANDLER (added) ---
  const handleChat = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMsg = { role: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput;
    setChatInput("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        query: query
      });
      const aiMsg = { role: "ai", text: res.data.response };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = { role: "ai", text: "Sorry, I couldn't reach the AI." };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  // Upload dataset
  const handleUpload = async () => {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setProductSales(res.data.product_sales);
      setHasProduct(res.data.has_product);
      setTotalSales(res.data.total_sales);

      const historicalData = res.data.historical;

      // Build chart data: historical with forecast: null, dates normalized
      const formatted = historicalData.map((item) => ({
        date: new Date(item.date).toISOString().split("T")[0],
        sales: item.sales,
        forecast: null,
      }));

      // Sort by date (just in case)
      formatted.sort((a, b) => new Date(a.date) - new Date(b.date));

      setChartData(formatted.slice(-100));  // keep last 100 points
      setModelDetails(res.data.model_details);
    } catch (error) {
      console.error("FULL ERROR:", error);
      console.error("BACKEND ERROR:", error.response);
      console.error("DETAIL:", error.response?.data?.detail);
    } finally {
      setIsUploading(false);
    }
  };

  // Predict future
  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", {
        days: Number(days),
      });

      const forecast = res.data.forecast;
      setProductPredictions(res.data.product_predictions);
      setTotalPrediction(res.data.total_prediction);

      // Calculate summary
      const values = forecast.map(item => item.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      setForecastSummary({
        avg: avg.toFixed(2),
        max: max.toFixed(2),
        min: min.toFixed(2),
      });

      // ✅ Get last REAL historical date (not forecast)
      const historicalOnly = chartData.filter(item => item.sales !== null);
      const lastHistoricalDate = historicalOnly.length > 0
        ? new Date(historicalOnly[historicalOnly.length - 1].date)
        : new Date();

      const formattedForecast = forecast.map((item, index) => {
        const futureDate = new Date(lastHistoricalDate);
        futureDate.setDate(futureDate.getDate() + index + 1);
        return {
          date: futureDate.toISOString().split('T')[0],
          sales: null,
          forecast: item.value,
          lower: item.lower,
          upper: item.upper,
        };
      });

      // Remove old forecast before adding new one
      const historicalPart = chartData.filter(item => item.sales !== null);
      let newChartData = [...historicalPart, ...formattedForecast];

      // Sort by date to ensure proper ordering
      newChartData.sort((a, b) => new Date(a.date) - new Date(b.date));

      setChartData(newChartData);
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 text-white p-6 lg:p-10 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400 bg-clip-text text-transparent drop-shadow-lg text-center lg:text-left">
          AI Sales Prediction Dashboard
        </h1>

        {/* Upload Section */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl hover:border-teal-500/50 transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-teal-300 flex items-center gap-2">
                <span className="text-3xl">📤</span> Upload Dataset
              </h2>
              <p className="text-slate-400 mt-1">
                Upload a CSV file with historical sales data.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-full
                  file:border-0 file:text-sm file:font-semibold
                  file:bg-teal-600 file:text-white
                  hover:file:bg-teal-700
                  file:cursor-pointer file:transition-colors
                  file:shadow-lg file:shadow-teal-600/30
                  border border-white/10 rounded-full p-1
                  bg-white/5 backdrop-blur-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-500/50
                  transition-all duration-300"
              />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`px-6 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  !file || isUploading
                    ? "bg-slate-600 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 hover:scale-105 shadow-teal-600/30"
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload & Train"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Model Insights */}
        {modelDetails && (
          <div className="backdrop-blur-xl bg-blue-900/20 border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
              🤖 AI Business Insights
            </h2>
            <p className="text-blue-100">📊 Accuracy: {accuracyDisplay}</p>
            <p className="text-blue-100">📈 Growth Rate: {modelDetails.growth_rate}</p>
            <p className="text-blue-100">⚡ Volatility: {modelDetails.volatility}</p>
            <div className="mt-4">
              <h3 className="text-lg text-green-300">💡 AI Guidance:</h3>
              {modelDetails?.ai_guidance?.map((item, index) => (
                <p key={index} className="text-green-100">• {item}</p>
              ))}
            </div>
          </div>
        )}

        {/* TOTAL SALES CARD */}
        {totalSales !== null && (
          <div className="backdrop-blur-xl bg-amber-900/20 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-semibold text-amber-300 mb-2 flex items-center gap-2">
              <span className="text-3xl">💰</span> Total Sales
            </h2>
            <p className="text-4xl font-bold text-amber-400">${totalSales.toFixed(2)}</p>
          </div>
        )}

        {/* Product Sales Section */}
        {hasProduct && productSales && (
          <div className="backdrop-blur-xl bg-white/5 border border-teal-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl hover:border-teal-500/50 transition-all duration-300">
            <h2 className="text-2xl font-semibold text-teal-300 mb-4 flex items-center gap-2">
              <span className="text-3xl">📦</span> Product Sales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(productSales).map(([product, value]) => (
                <div key={product} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-sm text-slate-300">{product}</p>
                  <p className="text-xl font-bold text-teal-400">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    📅 Based on {chartData.filter(d => d.sales !== null).length} days
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Combined Chart */}
        {chartData.length > 0 && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl hover:border-teal-500/50 transition-all duration-300 animate-fadeIn">
            <h2 className="text-2xl font-semibold text-teal-300 mb-6 flex items-center gap-2">
              <span className="text-3xl">📊</span> Sales Analytics
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2dd4bf"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2dd4bf" }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f59e0b" }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Prediction Section */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl hover:border-amber-500/50 transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-amber-300 flex items-center gap-2">
                <span className="text-3xl">🔮</span> Predict Future Sales
              </h2>
              <p className="text-slate-400 mt-1">
                Enter number of days to forecast.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300"
                min="1"
                max="365"
              />
              <button
                onClick={handlePredict}
                disabled={chartData.length === 0 || isPredicting}
                className={`px-6 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  chartData.length === 0 || isPredicting
                    ? "bg-slate-600 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 hover:scale-105 shadow-amber-600/30"
                }`}
              >
                {isPredicting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Predicting...
                  </>
                ) : (
                  "Predict"
                )}
              </button>
            </div>
          </div>

          {forecastSummary && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <h3 className="text-lg font-semibold text-amber-300 mb-2">📊 Prediction Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-400">Average Sales</p>
                  <p className="text-xl font-bold text-amber-400">{forecastSummary.avg}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Maximum Sales</p>
                  <p className="text-xl font-bold text-amber-400">{forecastSummary.max}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Minimum Sales</p>
                  <p className="text-xl font-bold text-amber-400">{forecastSummary.min}</p>
                </div>
              </div>
              {totalPrediction !== null && (
                <div className="mt-4 pt-4 border-t border-amber-500/30 text-center">
                  <p className="text-sm text-slate-400">Total Predicted Sales</p>
                  <p className="text-2xl font-bold text-amber-400">${totalPrediction.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {productPredictions && (
            <div className="mt-6 backdrop-blur-xl bg-white/5 border border-teal-500/30 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xl font-semibold text-teal-300 mb-4 flex items-center gap-2">
                <span className="text-2xl">📦</span> Product-Level Predictions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(productPredictions).map(([product, value]) => (
                  <div
                    key={product}
                    className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 backdrop-blur-sm rounded-xl p-4 border border-teal-500/30 hover:border-teal-400/60 hover:scale-105 transition-all duration-300"
                  >
                    <p className="text-sm text-teal-200/80 mb-1">{product}</p>
                    <p className="text-2xl font-bold text-teal-300">{typeof value === 'number' ? value.toFixed(2) : value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🤖 Floating Chat Icon */}
      <div
        onClick={() => setIsChatOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "#14b8a6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          color: "white",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
      >
        💬
      </div>

      {/* 💬 Chat Popup */}
      {isChatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "280px",
            height: "350px",
            background: "#0f172a",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            padding: "10px",
            zIndex: 9999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ color: "#14b8a6" }}>AI Assistant</h4>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginTop: "10px",
              marginBottom: "10px",
              fontSize: "14px"
            }}
          >
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                <b style={{ color: msg.role === "user" ? "#14b8a6" : "#f59e0b", display: "block", marginBottom: "4px" }}>
                  {msg.role === "user" ? "You" : "AI"}:
                </b>
                <div style={{ color: "white", fontSize: "14px", lineHeight: "1.5", overflowWrap: "break-word" }}>
                  {msg.role === "ai" ? (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p style={{margin: '0 0 8px 0'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{margin: '0 0 8px 0', paddingLeft: '20px', listStyleType: 'disc'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{margin: '0 0 8px 0', paddingLeft: '20px', listStyleType: 'decimal'}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: "5px" }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask..."
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "6px",
                border: "none"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChat();
              }}
            />
            <button
              onClick={handleChat}
              style={{
                background: "#14b8a6",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}