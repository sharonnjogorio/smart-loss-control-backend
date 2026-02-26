"""
Smart Loss Control - Anomaly Detection Engine
==============================================
Author: Data Science Team
Date: February 16, 2026

WHAT THIS FILE DOES:
This module acts like the "security brain" of the system.

It decides:
• When to trigger a stock count
• Whether sales behavior looks suspicious
• How serious a stock difference is
• Whether alerts should be sent
"""

# Import tools we need from Python

from typing import Dict, List, Optional   # For type hints (helps readability)
from datetime import datetime, timedelta  # For working with dates and time
from dataclasses import dataclass         # For creating simple data containers
import random                             # For random number generation


# -----------------------------------------------------------
# DATA CLASS — holds sales behavior information
# -----------------------------------------------------------

@dataclass
class SalesVelocityData:
    """
    Stores historical sales data for ONE product (SKU)

    Think of this as a report card of recent sales activity.
    """

    sku_id: str                     # Product ID
    hourly_sales: List[float]       # Sales recorded each hour (recent history)
    seven_day_average: float        # Average hourly sales over last 7 days
    last_count_timestamp: datetime  # When the last physical count happened
    total_sales_since_count: int    # How many units sold since last count


# -----------------------------------------------------------
# MAIN AI / LOGIC ENGINE
# -----------------------------------------------------------

class AnomalyDetectionEngine:
    """
    This is the main decision engine.

    It checks if something unusual is happening,
    which might indicate theft, mistakes, or risk.
    """

    # -------------------------------------------------------
    # DEFAULT SETTINGS (all thresholds in one place)
    # -------------------------------------------------------

    DEFAULT_CONFIG = {

        # 20% chance of random security check
        'random_probability': 0.20,

        # Trigger if current sales are 2× normal sales
        'volume_multiplier': 2.0,

        # Trigger if this many hours passed since last count
        'time_threshold_hours': 4,

        # Trigger after this many sales events
        'sales_counter_max': 10,

        # Variance severity thresholds
        'green_max': 1.0,     # <= 1% difference = OK
        'yellow_max': 10.0,   # <= 10% = Warning

        # Pattern detection settings
        'shift_window_min': 30,   # Last 30 minutes of shift
        'suspicious_sales': 10,   # 10+ sales in window = suspicious
        'gap_threshold_min': 240  # 4 hours gap between sales = suspicious
    }

    # -------------------------------------------------------
    # INITIALIZATION
    # -------------------------------------------------------

    def __init__(self, config: Dict = None):
        """
        Allows custom settings, but uses defaults if none provided.
        """
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}


    # -------------------------------------------------------
    # MAIN DECISION: SHOULD WE TRIGGER A STOCK COUNT?
    # -------------------------------------------------------

    def should_trigger_count(self, velocity: SalesVelocityData,
                             current_time: datetime,
                             sales_since_trigger: int = 0) -> Dict:
        """
        Checks ALL possible trigger conditions.

        Returns the MOST IMPORTANT one if multiple conditions are met.
        """

        triggers = []  # List of possible reasons to trigger a count

        # ---------------------------------------------------
        # 1. RANDOM SECURITY CHECK
        # ---------------------------------------------------

        if random.random() < self.config['random_probability']:
            triggers.append(('RANDOM', 2, 'Random security check'))

        # ---------------------------------------------------
        # 2. SALES VOLUME SPIKE
        # ---------------------------------------------------

        if self._is_volume_spike(velocity):
            rate = sum(velocity.hourly_sales[-1:]) if velocity.hourly_sales else 0
            triggers.append((
                'VOLUME',
                3,
                f'Sales spike: {rate:.1f} vs {velocity.seven_day_average:.1f} avg'
            ))

        # ---------------------------------------------------
        # 3. TOO MUCH TIME PASSED SINCE LAST COUNT
        # ---------------------------------------------------

        hours = (current_time - velocity.last_count_timestamp).total_seconds() / 3600

        if hours >= self.config['time_threshold_hours']:
            triggers.append(('TIME', 2, f'{hours:.1f} hours since last count'))

        # ---------------------------------------------------
        # 4. TOO MANY SALES SINCE LAST COUNT
        # ---------------------------------------------------

        if sales_since_trigger >= self.config['sales_counter_max']:
            triggers.append(('COUNTER', 1, f'{sales_since_trigger} sales since last count'))

        # ---------------------------------------------------
        # CHOOSE HIGHEST PRIORITY TRIGGER
        # ---------------------------------------------------

        if triggers:
            ttype, priority, reason = max(triggers, key=lambda x: x[1])

            return {
                'should_trigger': True,
                'type': ttype,
                'priority': priority,
                'reason': reason
            }

        # No triggers met
        return {'should_trigger': False}


    # -------------------------------------------------------
    # CLASSIFY HOW SERIOUS A STOCK DIFFERENCE IS
    # -------------------------------------------------------

    def classify_variance(self, variance_pct: float) -> Dict:
        """
        Converts percentage difference into severity level.
        """

        abs_var = abs(variance_pct)

        if abs_var <= self.config['green_max']:
            return {'severity': 'GREEN', 'send_alert': False}

        elif abs_var <= self.config['yellow_max']:
            return {'severity': 'YELLOW', 'send_alert': False}

        else:
            return {'severity': 'RED', 'send_alert': True}


    # -------------------------------------------------------
    # DETECT SUSPICIOUS SALES PATTERNS
    # -------------------------------------------------------

    def detect_theft_patterns(self, sales_log: List[Dict],
                              shift_end: datetime) -> Dict:
        """
        Looks for suspicious behaviors that might indicate theft.
        """

        patterns = []

        # ---------------------------------------------------
        # PATTERN 1: MANY SALES RIGHT BEFORE SHIFT ENDS
        # ---------------------------------------------------

        window_start = shift_end - timedelta(minutes=self.config['shift_window_min'])

        spike_sales = [
            s for s in sales_log
            if window_start <= datetime.fromisoformat(s['timestamp']) <= shift_end
        ]

        if len(spike_sales) >= self.config['suspicious_sales']:
            patterns.append({
                'pattern': 'end_of_shift_spike',
                'severity': 'high',
                'description': f'{len(spike_sales)} sales in final {self.config["shift_window_min"]} min'
            })

        # ---------------------------------------------------
        # PATTERN 2: LONG PERIOD WITH NO SALES
        # ---------------------------------------------------

        if len(sales_log) > 1:

            gaps = [
                (
                    datetime.fromisoformat(sales_log[i]['timestamp']) -
                    datetime.fromisoformat(sales_log[i-1]['timestamp'])
                ).total_seconds() / 60
                for i in range(1, len(sales_log))
            ]

            max_gap = max(gaps) if gaps else 0

            if max_gap > self.config['gap_threshold_min']:
                patterns.append({
                    'pattern': 'extended_gap',
                    'severity': 'medium',
                    'description': f'{max_gap:.0f} min gap between sales'
                })

        # ---------------------------------------------------
        # FINAL RESULT
        # ---------------------------------------------------

        return {
            'has_suspicious_activity': len(patterns) > 0,
            'patterns': patterns,
            'risk_level': (
                'high' if any(p['severity'] == 'high' for p in patterns)
                else 'medium' if patterns else 'low'
            )
        }


    # -------------------------------------------------------
    # HELPER FUNCTION — CHECK FOR SALES SPIKE
    # -------------------------------------------------------

    def _is_volume_spike(self, velocity: SalesVelocityData) -> bool:
        """
        Determines if recent sales are unusually high.
        """

        if not velocity.hourly_sales:
            return False

        recent = sum(velocity.hourly_sales[-1:]) / 1
        threshold = velocity.seven_day_average * self.config['volume_multiplier']

        return recent > threshold


# -----------------------------------------------------------
# QUICK COUNT MANAGER — Handles staff prompts & responses
# -----------------------------------------------------------

class QuickCountManager:
    """
    Manages the process of asking staff to count items
    and processing their response.
    """

    @staticmethod
    def generate_prompt(sku: Dict) -> Dict:
        """
        Creates a message to display on the screen asking
        staff to count stock.
        """

        return {
            'prompt': f"Quick Check: How many {sku['brand']} {sku['size']} on shelf?",
            'sku_id': sku['sku_id'],
            'ui_locked': True,              # Prevents other actions
            'background_color': '#D4AF37'   # Golden color for alert
        }

    @staticmethod
    def process_count(expected: float, actual: float,
                      unit_price: float, staff_id: str) -> Dict:
        """
        Processes the count submitted by staff.
        Calculates difference and financial loss.
        """

        engine = AnomalyDetectionEngine()

        variance_pct = ((actual - expected) / expected * 100) if expected > 0 else 0
        classification = engine.classify_variance(variance_pct)

        return {
            'expected': expected,
            'actual': actual,
            'variance': actual - expected,
            'variance_pct': variance_pct,
            'severity': classification['severity'],
            'send_alert': classification['send_alert'],
            'financial_loss': abs(actual - expected) * unit_price,
            'staff_id': staff_id,
            'timestamp': datetime.now().isoformat()
        }


# -----------------------------------------------------------
# QUICK TEST — runs only if file executed directly
# -----------------------------------------------------------

if __name__ == "__main__":

    engine = AnomalyDetectionEngine()

    print("Variance Classification:")

    for var in [0.5, 5.0, 15.0]:
        result = engine.classify_variance(var)
        print(f"  {var}% → {result['severity']}, Alert: {result['send_alert']}")

    print("\nTrigger Decision:")

    velocity = SalesVelocityData(
        sku_id="KINGS_5L",
        hourly_sales=[5, 4, 15],   # Big spike in last hour
        seven_day_average=5.0,
        last_count_timestamp=datetime.now() - timedelta(hours=5),
        total_sales_since_count=12
    )

    decision = engine.should_trigger_count(velocity, datetime.now(), 12)

    print(f"  Trigger: {decision['should_trigger']}")

    if decision['should_trigger']:
        print(f"  Type: {decision['type']}, Reason: {decision['reason']}")