import random

ADJECTIVES = [
    "red", "blue", "green", "swift", "quiet", "brave", "bright", "cool",
    "calm", "wild", "fast", "warm", "sharp", "bold", "keen", "grand"
]

NOUNS = [
    "fox", "dog", "cat", "bear", "wolf", "hawk", "lion", "tiger",
    "star", "moon", "sun", "wave", "peak", "wind", "tree", "river"
]

def generate_short_code() -> str:
    """Generates a human-typeable short code in the format: word-word-number (e.g., blue-dog-42)."""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(10, 99)
    return f"{adj}-{noun}-{num}"