import streamlit as st
import pandas as pd
import plotly.express as px
import sys
import os

# Add src to path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

try:
    from analysis import get_drug_subset, compute_counts, compute_probabilities
    from insights import generate_insight
    from utils import sanitize_input, limit_top_n
except ImportError as e:
    st.error(f"Error importing modules: {e}")
    st.stop()

# --- Config ---
st.set_page_config(page_title="Pediatric Drug Safety Analyzer", page_icon="💊", layout="wide")

# --- Load Data ---
@st.cache_data
def load_cleaned_data():
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'cleaned_data.csv'))
    try:
        return pd.read_csv(data_path)
    except FileNotFoundError:
        st.error(f"Cleaned data not found at `data/cleaned_data.csv`. Please run `python src/preprocess.py` first.")
        st.stop()

# --- App ---
st.title("Pediatric Drug Safety Analyzer")
st.markdown("Describe the situation, and we will analyze the probability of side effects affecting children.")

# Load dataset
df = load_cleaned_data()

# User Input in the Middle of the Page
st.markdown("### How can we help?")
user_input = st.text_input(
    "Describe what happened:", 
    placeholder="e.g., my child took amoxicillin and has rashes"
)

if user_input:
    text = user_input.lower()
    
    available_drugs = df['drugs'].unique().tolist()
    available_reactions = df['reactions'].unique().tolist()
    
    # Extract entities
    found_drugs = [d for d in available_drugs if d in text]
    
    # Simple check for reactions, checking if the exact word exists (including simple plural handling)
    found_reactions = []
    for r in available_reactions:
        if r in text or (r + "es") in text or (r + "s") in text:
            found_reactions.append(r)
            
    # De-duplicate
    found_reactions = list(set(found_reactions))
    
    if not found_drugs:
        st.warning("We couldn't identify any medicines in your description. Please make sure the drug is spelled correctly.")
    else:
        # Use the first identified drug
        selected_drug = found_drugs[0]
        clean_drug = sanitize_input(selected_drug)
        
        # 1. Get subset
        subset = get_drug_subset(df, clean_drug)
        
        if subset.empty:
            st.warning(f"No pediatric data found for {selected_drug.title()}.")
        else:
            # 2. Analyze
            counts = compute_counts(subset)
            probs = compute_probabilities(counts)
            
            # 3. Generate Insight
            insight = generate_insight(clean_drug, probs, found_reactions)
            
            # --- UI LAYOUT ---
            st.markdown("---")
            
            # Section 3: Insight (placed at top for visibility)
            st.markdown("## 💡 Key Insight")
            st.success(insight)
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # Use tabs for a horizontal menu
            tab1, tab2 = st.tabs(["📊 Bar Chart", "📋 Side Effects Breakdown"])
            
            with tab1:
                st.subheader(f"Likelihood of Reactions for {selected_drug.title()}")
                top_n = limit_top_n(probs, n=15)
                
                top_n_display = top_n.copy()
                top_n_display['Probability (%)'] = top_n_display['probability'] * 100
                
                fig_bar = px.bar(
                    top_n_display, 
                    x='Probability (%)', 
                    y='reaction', 
                    orientation='h',
                    title="Most Common Adverse Reactions",
                    labels={'Probability (%)': 'Probability (%)', 'reaction': 'Reaction'}
                )
                fig_bar.update_layout(yaxis={'categoryorder':'total ascending'})
                st.plotly_chart(fig_bar, use_container_width=True)
                
            with tab2:
                st.subheader("Detailed Breakdown")
                
                # Minimum Probability Filter inside the tab
                min_prob = st.slider("Minimum Probability Filter (%):", min_value=0.0, max_value=100.0, value=5.0, step=1.0)
                
                filtered_probs = probs[probs['probability'] * 100 >= min_prob].copy()
                
                if filtered_probs.empty:
                    st.write(f"No side effects have a probability higher than {min_prob}%.")
                else:
                    display_df = filtered_probs.copy()
                    display_df['Probability (%)'] = (display_df['probability'] * 100).round(2)
                    display_df = display_df.rename(columns={'reaction': 'Side Effect', 'count': 'Number of Reports'})
                    display_df = display_df.sort_values(by='Probability (%)', ascending=False)
                    
                    st.dataframe(
                        display_df[['Side Effect', 'Probability (%)', 'Number of Reports']],
                        use_container_width=True
                    )
