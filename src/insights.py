def generate_insight(drug_name, probs, found_reactions=None):
    """Generate human-readable insight based on probabilities and user context."""
    if probs is None or probs.empty:
        return f"No side effect data found for {drug_name.title()} in pediatric patients."
    
    insight_parts = []
    
    if found_reactions:
        for fr in found_reactions:
            match = probs[probs['reaction'] == fr]
            if not match.empty:
                prob = match.iloc[0]['probability'] * 100
                insight_parts.append(f"You mentioned **{fr}**. Based on our data, there is a **{prob:.1f}%** probability of children experiencing **{fr}** when taking {drug_name.title()}.")
            else:
                insight_parts.append(f"You mentioned **{fr}**, but we do not have pediatric reports linking it to {drug_name.title()} in our database.")
                
    # Also add the general top reaction insight
    top_reaction = probs.sort_values(by='probability', ascending=False).iloc[0]
    reaction = top_reaction['reaction']
    probability = top_reaction['probability'] * 100
    
    general_insight = (
        f"Overall, the most common side effect reported for {drug_name.title()} is "
        f"**{reaction}** ({probability:.1f}%)."
    )
    
    if not insight_parts:
        insight_parts.append(f"**Insight:** When children take {drug_name.title()}, the most common side effect reported is **{reaction}**, with an estimated probability of **{probability:.1f}%**.")
    else:
        insight_parts.append(general_insight)
        
    return "\n\n".join(insight_parts)
