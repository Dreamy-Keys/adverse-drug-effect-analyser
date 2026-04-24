import pandas as pd

def get_drug_subset(df, drug_name):
    """Filter dataset for a specific drug."""
    # Ensure exact match
    return df[df['drugs'] == drug_name.lower().strip()]

def compute_counts(df):
    """Compute reaction frequency per drug."""
    counts = df['reactions'].value_counts().reset_index()
    counts.columns = ['reaction', 'count']
    return counts

def compute_probabilities(counts):
    """Compute probability distribution of reactions."""
    total = counts['count'].sum()
    if total == 0:
        counts['probability'] = 0.0
    else:
        counts['probability'] = counts['count'] / total
    return counts
