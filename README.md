# Pediatric Drug Safety Analyzer

This project is a Streamlit application designed to analyze pediatric adverse drug events and detect unexpected side effects using statistical anomaly detection (Z-scores).

## 📁 Project Structure

```text
project_root/
├── data/
│   ├── raw_data.csv        # Sample raw dataset
│   └── cleaned_data.csv    # Generated after running preprocessing
├── src/
│   ├── preprocess.py       # Data cleaning and filtering
│   ├── analysis.py         # Frequency and probability calculations
│   ├── anomaly.py          # Z-score based anomaly detection
│   ├── insights.py         # Natural language insight generation
│   └── utils.py            # Helper functions
├── app/
│   └── streamlit_app.py    # Main Streamlit UI
├── requirements.txt        # Project dependencies
└── README.md               # Documentation
```

## 🚀 How to Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run data preprocessing:**
   This step cleans the raw data and filters for pediatric cases (age < 12).
   ```bash
   python src/preprocess.py
   ```
   *(Ensure you run this from the project root directory so paths resolve correctly)*

3. **Launch the Streamlit app:**
   ```bash
   streamlit run app/streamlit_app.py
   ```

## 🧠 Anomaly Detection

The app uses a simple yet effective statistical method to detect unexpected side effects:
1. It calculates the **probability** of each adverse reaction for a specific drug.
2. It computes the **mean** and **standard deviation** of these probabilities.
3. It calculates the **Z-score** for each reaction: `Z = (Probability - Mean) / Standard Deviation`.
4. Reactions with a Z-score greater than a specified threshold (default 2.0) are flagged as **anomalies**.

This method highlights side effects that occur at an unusually high rate compared to the typical distribution of reactions for that drug.
