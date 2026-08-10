"""
AI Service Module for StudyTrack.
Provides deterministic offline Note Summarization, Vocabulary Embedding, and Cosine Similarity Search.
"""

import math
import re
from collections import Counter
from typing import List, Dict, Any, Union

# Exact 5-note sample dataset for semantic search
SAMPLE_NOTES = [
    {
        "id": 1,
        "text": "Binary search requires a sorted array and repeatedly halves the search range using a midpoint comparison."
    },
    {
        "id": 2,
        "text": "Insertion sort builds a sorted list one element at a time by shifting larger elements to the right."
    },
    {
        "id": 3,
        "text": "FastAPI uses Pydantic models to validate request bodies and automatically generates Swagger documentation."
    },
    {
        "id": 4,
        "text": "SQL joins combine rows from two tables using a matching column, such as inner join, left join, and full join."
    },
    {
        "id": 5,
        "text": "Prompt engineering structures a task, context, constraints, and desired output format to guide an LLM's response."
    },
]

# Exact 12-word fixed vocabulary in exact order
VOCABULARY = [
    "sort",
    "search",
    "binary",
    "insertion",
    "sql",
    "join",
    "fastapi",
    "pydantic",
    "prompt",
    "llm",
    "database",
    "validate",
]


def summarize_notes(raw_text: str) -> Dict[str, Any]:
    """
    Deterministically summarizes raw study notes into a fixed-shape JSON object containing
    exactly three keys: 'topic', 'key_points', and 'difficulty'.
    
    Rule Specifications:
    - Empty/whitespace input: Returns topic='untitled', key_points=[], difficulty='easy'.
    - Topic: Derived from the first non-empty line (if <= 60 chars) or the most frequent non-trivial word (>= 3 chars).
    - Key Points: List of up to 3 non-empty sentences split on [.!?], stripped of whitespace.
    - Difficulty: Based on total word count thresholds (< 40 -> 'easy', 40..100 -> 'medium', > 100 -> 'hard').
    """
    if not raw_text or not raw_text.strip():
        return {
            "topic": "untitled",
            "key_points": [],
            "difficulty": "easy"
        }

    clean_text = raw_text.strip()
    words = re.findall(r'\b\w+\b', clean_text)
    word_count = len(words)

    # 1. Determine Difficulty
    if word_count < 40:
        difficulty = "easy"
    elif word_count <= 100:
        difficulty = "medium"
    else:
        difficulty = "hard"

    # 2. Extract Key Points (up to 3 non-empty sentences/phrases)
    raw_sentences = [s.strip() for s in re.split(r'[.!?\n]+', clean_text) if s.strip()]
    if not raw_sentences or len(raw_sentences) == 1:
        # Fallback to comma splitting if text has commas
        comma_split = [s.strip() for s in clean_text.split(",") if s.strip()]
        if len(comma_split) > 1:
            raw_sentences = comma_split

    key_points = raw_sentences[:3]

    # 3. Derive Topic
    lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
    topic = "untitled"
    if lines and len(lines[0]) <= 60:
        topic = lines[0].strip().title()
    else:
        # Fallback to most frequent non-trivial word (length >= 3)
        non_trivial = [w.lower() for w in words if len(w) >= 3]
        if non_trivial:
            counts = Counter(non_trivial)
            most_common_word, _ = counts.most_common(1)[0]
            topic = most_common_word.title()

    return {
        "topic": topic,
        "key_points": key_points,
        "difficulty": difficulty
    }


def mock_embed(text: str) -> List[float]:
    """
    Turns any input string into a 12-dimensional numeric vector using exact whole-token word counts
    against the fixed VOCABULARY.
    
    Tokenization: Lowercases input, splits on non-alphanumeric characters.
    Output: Python list of exactly 12 floats in VOCABULARY order.
    """
    if not text or not text.strip():
        return [0.0] * len(VOCABULARY)

    # Tokenize by splitting on any run of characters that are not letters or digits
    tokens = [t for t in re.split(r'[^a-zA-Z0-9]+', text.lower()) if t]
    token_counts = Counter(tokens)

    # Return vector of counts in exact vocabulary order
    return [float(token_counts.get(vocab_word, 0)) for vocab_word in VOCABULARY]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Computes cosine similarity between two numeric vectors from first principles:
    dot_product(A, B) / (|A| * |B|)
    
    Zero-Vector Rule: If either vector has an L2 norm of 0.0, returns 0.0 directly
    without raising a ZeroDivisionError.
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    magnitude_a = math.sqrt(sum(a * a for a in vec_a))
    magnitude_b = math.sqrt(sum(b * b for b in vec_b))

    # Avoid division by zero
    if magnitude_a == 0.0 or magnitude_b == 0.0:
        return 0.0

    similarity = dot_product / (magnitude_a * magnitude_b)
    # Clamp to [-1.0, 1.0] for precision bounds
    return max(-1.0, min(1.0, float(similarity)))


def search_notes_by_query(query: str) -> List[Dict[str, Any]]:
    """
    Embeds all sample notes and the incoming query using mock_embed, computes cosine similarity,
    and returns notes sorted by score descending, each annotated with its computed score.
    
    If query embeds to an all-zero vector, returns all notes with score 0.0 in original id order.
    """
    query_vec = mock_embed(query)
    query_norm = math.sqrt(sum(q * q for q in query_vec))

    results = []
    for note in SAMPLE_NOTES:
        note_vec = mock_embed(note["text"])
        score = cosine_similarity(query_vec, note_vec)
        note_copy = note.copy()
        note_copy["score"] = round(score, 4)
        results.append(note_copy)

    # If query is all-zeros, preserve original ID order; otherwise sort descending by score
    if query_norm == 0.0:
        return results
    
    # Sort descending by score, maintaining stable sort order for ties
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
