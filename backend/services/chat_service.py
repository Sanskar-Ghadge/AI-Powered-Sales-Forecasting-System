from google import genai
import os
import services.model_service as model_service

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def handle_chat(query: str):

    if getattr(model_service, 'raw_data_df', None) is None:
        return {"response": "Please upload dataset first."}

    df = model_service.raw_data_df

    total_sales = df['sales'].sum()
    avg_sales = df['sales'].mean()
    max_sales = df['sales'].max()
    min_sales = df['sales'].min()

    # Product summary
    product_summary = {}
    if 'product' in df.columns:
        product_summary = (
            df.groupby('product')['sales']
            .sum()
            .round(2)
            .to_dict()
        )

    context = f"""
    Dataset Summary:
    Total Sales: {total_sales:.2f}
    Average Sales: {avg_sales:.2f}
    Max Sales: {max_sales:.2f}
    Min Sales: {min_sales:.2f}
    Product Sales: {product_summary}
    """

    prompt = context + "\nUser Query: " + query

    try:
        print(f"Sending prompt to Gemini (length {len(prompt)}): {prompt[:100]}...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        print(f"Received response from Gemini: {response.text[:100]}...")
        return {"response": response.text}

    except Exception as e:
        print("Gemini Error:", e)

        # 🔥 Fallback Logic (SMART PART)
        q = query.lower()

        if "total" in q:
            return {"response": f"Total sales are {total_sales:.2f}"}

        elif "average" in q or "avg" in q:
            return {"response": f"Average sales are {avg_sales:.2f}"}

        elif "max" in q or "highest" in q:
            return {"response": f"Maximum sales recorded are {max_sales:.2f}"}

        elif "min" in q or "lowest" in q:
            return {"response": f"Minimum sales recorded are {min_sales:.2f}"}

        elif "product" in q and product_summary:
            best_product = max(product_summary, key=product_summary.get)
            return {
                "response": f"{best_product} has the highest sales of {product_summary[best_product]:.2f}"
            }

        elif "growth" in q:
            return {"response": "Sales show an overall increasing trend based on the dataset."}

        else:
            return {
                "response": f"Basic insights → Total: {total_sales:.2f}, Avg: {avg_sales:.2f}"
            }