import numpy as np
import pandas as pd

def compute_z_scores(probs):
    """Compute z-scores for reaction probabilities."""
    # Creating a copy to avoid SettingWithCopyWarning
    probs = probs.copy()
    
    mean_prob = probs['probability'].mean()
    std_prob = probs['probability'].std()
    
    # If standard deviation is 0 or NaN (e.g., only one reaction), z-score is 0
    if pd.isna(std_prob) or std_prob == 0:
        probs['z_score'] = 0.0
    else:
        probs['z_score'] = (probs['probability'] - mean_prob) / std_prob
        
    return probs

def detect_anomalies(probs, threshold=2.0):
    """Detect anomalies where z-score > threshold."""
    # Add z-scores
    scored = compute_z_scores(probs)
    # Filter anomalies
    anomalies = scored[scored['z_score'] > threshold]
    return anomalies
