"""
AI-powered rate calculator using Claude API.
Calculates parking costs based on complex rate structures.
"""

import os

from anthropic import Anthropic
from flask import current_app
from typing import List, Dict, Optional
import json
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from app import cache


"""
Use Claude AI to calculate parking costs based on complex rate structures.

Handles edge cases like:
- "First 2 hours free, then $3/hr"
- "$2/hr weekdays, $4/hr weekends"
- "$1 per half hour for first 3 hrs, $2 per half hour after"
"""

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not configured")

_client = Anthropic(api_key=api_key)


def calculate_costs(
    carparks: List[Dict],
    duration_hours: float,
    day_type: str = "weekday",
    max_calculate: int = 5,  # Only calculate top 5 to save time/cost
) -> List[Dict]:
    """
    Calculate parking costs for multiple carparks using AI with parallel processing.

    Args:
        carparks: List of carpark dicts with pricing info
        duration_hours: Parking duration (e.g., 2.5 hours)
        day_type: Type of day for rate calculation (weekday/saturday/sunday)
        max_calculate: Maximum number of carparks to calculate (default 5)

    Returns:
        List of carparks enriched with calculated_cost and cost_breakdown
    """
    results = []
    carparks_to_calculate = []

    # Separate carparks that need calculation
    for carpark in carparks:
        if not carpark.get("has_pricing") or not carpark.get("pricing"):
            results.append(
                {
                    **carpark,
                    "calculated_cost": None,
                    "cost_breakdown": "Pricing data unavailable",
                    "ai_explanation": None,
                }
            )
        elif len(carparks_to_calculate) < max_calculate:
            carparks_to_calculate.append(carpark)
        else:
            results.append(
                {
                    **carpark,
                    "calculated_cost": None,
                    "cost_breakdown": "Calculate top results only",
                    "ai_explanation": None,
                }
            )

    # Calculate costs in parallel using ThreadPoolExecutor
    if carparks_to_calculate:
        with ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all calculation tasks
            future_to_carpark = {
                executor.submit(
                    _calculate_single_carpark, carpark, duration_hours, day_type
                ): carpark
                for carpark in carparks_to_calculate
            }

            # Collect results as they complete
            calculated_results = {}
            for future in as_completed(future_to_carpark):
                carpark = future_to_carpark[future]
                try:
                    cost_info = future.result()
                    calculated_results[carpark["carpark_num"]] = {
                        **carpark,
                        **cost_info,
                    }
                except Exception as e:
                    current_app.logger.error(
                        f"Error calculating cost for {carpark['carpark_num']}: {e}"
                    )
                    calculated_results[carpark["carpark_num"]] = {
                        **carpark,
                        "calculated_cost": None,
                        "cost_breakdown": "Calculation error",
                        "ai_explanation": str(e),
                    }

            # Add calculated results in original order
            for carpark in carparks_to_calculate:
                results.append(calculated_results[carpark["carpark_num"]])

    # Results are already in original order (no sorting needed)
    return results


def _calculate_single_carpark(
    carpark: Dict, duration_hours: float, day_type: str
) -> Dict:
    """Calculate cost for a single carpark using Claude with caching."""

    pricing = carpark["pricing"]

    # Select appropriate rate based on day type
    rate_string = _select_rate_string(pricing, day_type)

    if not rate_string:
        return {
            "calculated_cost": None,
            "cost_breakdown": "No rate information for this day",
            "ai_explanation": None,
        }

    # Call the cached function with only hashable primitive args
    return _calculate_with_claude(
        carpark_num=carpark["carpark_num"],
        carpark_name=carpark["development"],
        rate_string=rate_string,
        duration_hours=duration_hours,
        day_type=day_type,
    )


CACHE_VERSION = 2  # Bump this to invalidate all cached AI calculations


@cache.memoize(timeout=86400)
def _calculate_with_claude(
    carpark_num: str,
    carpark_name: str,
    rate_string: str,
    duration_hours: float,
    day_type: str,
    _v: int = CACHE_VERSION,  # Cache buster — changing CACHE_VERSION invalidates all entries
) -> Dict:
    """Cached Claude API call — only takes hashable primitive args for reliable cache keys."""

    prompt = _build_calculation_prompt(
        carpark_name=carpark_name,
        rate_string=rate_string,
        duration_hours=duration_hours,
        day_type=day_type,
    )

    try:
        # Call Claude API
        response = _client.messages.create(
            model="claude-3-haiku-20240307",  # Claude Haiku (fast & cheap)
            max_tokens=500,
            temperature=0,  # Deterministic for math
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse JSON response
        result_text = response.content[0].text  # type: ignore

        # Extract JSON from markdown code blocks if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result = json.loads(result_text)

        return {
            "calculated_cost": float(result["total_cost"]),
            "cost_breakdown": result["breakdown"],
            "ai_explanation": result.get("explanation"),
            "ai_confidence": result.get("confidence", "high"),
        }

    except Exception as e:
        current_app.logger.error(f"AI calculation failed for {carpark_num}: {str(e)}")
        return {
            "calculated_cost": None,
            "cost_breakdown": "Calculation error",
            "ai_explanation": str(e),
        }


def _select_rate_string(pricing: Dict, day_type: str) -> Optional[str]:
    """Select appropriate rate string based on day type."""
    if day_type == "saturday":
        return pricing.get("saturday_rate") or pricing.get("weekday_rate")
    elif day_type == "sunday":
        return pricing.get("sunday_rate") or pricing.get("weekday_rate")
    else:
        # Weekday - check if there's time-based variation
        rate1 = pricing.get("weekday_rate", "")
        rate2 = pricing.get("weekday_rate_after_hours", "")
        if rate2:
            return f"{rate1} | After hours: {rate2}"
        return rate1


def _build_calculation_prompt(
    carpark_name: str, rate_string: str, duration_hours: float, day_type: str
) -> str:
    """Build prompt for Claude to calculate parking cost."""

    return f"""You are a parking cost calculator. Calculate the EXACT cost to park at this carpark.You are calculating for EXACTLY {duration_hours} hours. Your breakdown MUST use {duration_hours} hours, not any other number.

CARPARK: {carpark_name}
RATE STRUCTURE: {rate_string}
PARKING DURATION: {duration_hours} hours
DAY TYPE: {day_type}

INSTRUCTIONS:
1. Parse the rate structure carefully (handle cases like "first X hours free", "per half hour", etc.)
2. Calculate the exact cost for the given duration in Singapore dollars (SGD)
3. Show your breakdown step-by-step
4. Return ONLY valid JSON in this exact format:

{{
  "total_cost": <number in SGD, e.g., 6.50>,
  "breakdown": "<step-by-step calculation, e.g., 'First 2 hrs free, then 1.5 hrs × $3/hr = $4.50'>",
  "explanation": "<brief explanation of rate structure applied>",
  "confidence": "high"
}}

IMPORTANT RULES:
- If rate is "per half hour", calculate accordingly (e.g., 1.5 hours = 3 half hours)
- If rate varies by time (e.g., "after 5pm"), assume daytime rates unless specified
- Round to 2 decimal places
- Return ONLY the JSON object, no markdown formatting, no other text

Calculate now:"""
