def sanitize_input(text):
    """Sanitize user input."""
    if not isinstance(text, str):
        return ""
    return text.strip().lower()

def sort_results(df, by_col='count', ascending=False):
    """Sort results dataframe."""
    if df is None or df.empty:
        return df
    return df.sort_values(by=by_col, ascending=ascending)

def limit_top_n(df, n=10):
    """Limit dataframe to top N rows."""
    if df is None or df.empty:
        return df
    return df.head(n)
