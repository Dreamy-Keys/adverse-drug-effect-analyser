import pandas as pd
import numpy as np

def load_data(path):
    """Load raw CSV data."""
    return pd.read_csv(path)

def preprocess_data(df):
    """
    Clean data:
    - lowercase drugs and reactions
    - drop nulls in critical columns
    - Split semicolon-separated values
    - Explode into one drug-reaction per row
    - Strip whitespace
    - Filter pediatric cases (age < 12)
    """
    # Drop nulls in critical columns
    df = df.dropna(subset=['drugs', 'reactions', 'age'])
    
    # Filter pediatric cases (age < 12)
    df = df[df['age'] < 12].copy()
    
    # Lowercase
    df['drugs'] = df['drugs'].str.lower()
    df['reactions'] = df['reactions'].str.lower()
    
    # Split semicolon-separated values into lists
    df['drugs'] = df['drugs'].str.split(';')
    df['reactions'] = df['reactions'].str.split(';')
    
    # Explode drugs first
    df = df.explode('drugs')
    # Explode reactions next
    df = df.explode('reactions')
    
    # Strip whitespace
    df['drugs'] = df['drugs'].str.strip()
    df['reactions'] = df['reactions'].str.strip()
    
    # Drop empty strings
    df = df[(df['drugs'] != '') & (df['reactions'] != '')]
    
    return df

def save_clean_data(df, path):
    """Save cleaned dataset."""
    df.to_csv(path, index=False)

if __name__ == "__main__":
    import os
    
    # Ensure script can be run from anywhere by resolving paths relative to this file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_path = os.path.join(base_dir, "data", "raw_data.csv")
    clean_path = os.path.join(base_dir, "data", "cleaned_data.csv")
    
    df = load_data(raw_path)
    clean_df = preprocess_data(df)
    save_clean_data(clean_df, clean_path)
    print(f"Data cleaned and saved to {clean_path}")
