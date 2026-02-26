"""
Smart Loss Control - Inventory Calculation Engine
==================================================

Author: Data Science Team
Date: February 16, 2026

CORE PRINCIPLE:
Expected Stock = Initial + Deliveries - Sales

Meaning:
- Start with what you had at the beginning
- Add what you received
- Subtract what was sold
- The result is what SHOULD remain

NOTE:
Decant operations (breaking cartons into units)
do NOT change total stock — only how it is stored.
"""

# Import type hints for clarity (not required, but helps readability)
from typing import Dict, List

# Used to record timestamps for audit logs
from datetime import datetime

# dataclass helps create simple data containers automatically
from dataclasses import dataclass, field


# -------------------------------------------------------------------
# DATA MODEL: InventoryState
# -------------------------------------------------------------------
# This represents the state of one product (SKU) at a given time.
# Think of it as a a structured "record" of inventory information.
# -------------------------------------------------------------------

@dataclass
class InventoryState:
    """Current inventory state for a single product (SKU)"""

    # Unique product identifier
    sku_id: str

    # Brand name of the product
    brand: str

    # Size of the product (e.g., 5L, 1L, etc.)
    size: str

    # Quantity available at the start of the day
    initial_stock: float

    # Number of cartons received during the day
    cartons_received: int

    # Quantity sold during the day
    units_sold: float

    # How many litres are inside one carton (default = 12)
    litres_per_carton: int = 12


# -------------------------------------------------------------------
# CORE ENGINE: InventoryEngine
# -------------------------------------------------------------------
# This class performs all inventory-related calculations.
# -------------------------------------------------------------------

class InventoryEngine:
    """Core inventory calculations"""

    # Constant value: 1 carton equals 12 litres
    CARTON_CONVERSION = 12


    # ---------------------------------------------------------------
    # METHOD: calculate_expected
    # ---------------------------------------------------------------
    # Calculates what stock SHOULD be at the end of the day.
    # ---------------------------------------------------------------
    @classmethod
    def calculate_expected(cls, state: InventoryState) -> float:
        """
        Calculate expected stock

        Formula:
        Expected Stock = Initial Stock + (Cartons × 12) - Units Sold

        Parameters:
            state — an InventoryState object containing all inputs

        Returns:
            Expected stock level (float)
        """

        # Convert cartons received into litres
        additions = state.cartons_received * cls.CARTON_CONVERSION

        # Apply the core formula
        expected_stock = state.initial_stock + additions - state.units_sold

        return expected_stock


    # ---------------------------------------------------------------
    # METHOD: calculate_variance
    # ---------------------------------------------------------------
    # Compares expected stock with actual physical count.
    # ---------------------------------------------------------------
    @staticmethod
    def calculate_variance(expected: float, actual: float) -> Dict:
        """
        Calculate difference between expected stock and actual stock.

        Parameters:
            expected — what the system thinks should be there
            actual — what was physically counted

        Returns:
            Dictionary containing:
            - variance (difference)
            - percentage difference
            - status (SHORTAGE, SURPLUS, MATCH)
        """

        # Difference between actual stock and expected stock
        variance = actual - expected

        # Percentage difference (avoid division by zero)
        variance_pct = (variance / expected * 100) if expected > 0 else 0

        return {
            'expected': expected,
            'actual': actual,
            'variance': variance,
            'variance_pct': variance_pct,

            # Determine status based on variance
            'status': (
                'SHORTAGE' if variance < 0
                else 'SURPLUS' if variance > 0
                else 'MATCH'
            )
        }


    # ---------------------------------------------------------------
    # METHOD: calculate_loss
    # ---------------------------------------------------------------
    # Converts missing stock into financial value.
    # ---------------------------------------------------------------
    @staticmethod
    def calculate_loss(variance: float, unit_price: float) -> float:
        """
        Calculate financial impact in US Dollars (USD).

        Parameters:
            variance — quantity difference (can be negative)
            unit_price — price per unit (USD)

        Returns:
            Monetary loss (positive value, USD)
        """

        # abs() ensures the result is always positive
        return abs(variance) * unit_price


    # ---------------------------------------------------------------
    # METHOD: validate_delivery
    # ---------------------------------------------------------------
    # Checks whether supplier delivered correct quantity.
    # ---------------------------------------------------------------
    @staticmethod
    def validate_delivery(ordered: int, received: int, unit_price: float) -> Dict:
        """
        Validate supplier delivery to detect shortages or errors.

        Parameters:
            ordered — quantity requested
            received — quantity delivered
            unit_price — cost per unit (USD)

        Returns:
            Dictionary with discrepancy details
        """

        # Difference between received and ordered
        discrepancy = received - ordered

        return {
            'ordered': ordered,
            'received': received,
            'discrepancy': discrepancy,

            # Percentage difference
            'discrepancy_pct': (
                discrepancy / ordered * 100
                if ordered > 0 else 0
            ),

            # Flag if mismatch exists
            'status': 'FLAGGED' if discrepancy != 0 else 'VERIFIED',

            # Financial impact of discrepancy (USD)
            'financial_impact': abs(discrepancy) * unit_price,

            # Only received quantity is added to inventory
            'accepted_qty': received
        }


    # ---------------------------------------------------------------
    # METHOD: log_decant
    # ---------------------------------------------------------------
    # Records carton-breaking activity for audit purposes.
    # Does NOT affect total inventory.
    # ---------------------------------------------------------------
    @staticmethod
    def log_decant(cartons: int, litres_per_carton: int = 12) -> Dict:
        """
        Log decant operation (breaking cartons into smaller units).

        Important:
        This does NOT change total stock — only storage form.

        Parameters:
            cartons — number of cartons broken
            litres_per_carton — litres in each carton

        Returns:
            Audit record dictionary
        """

        return {
            'cartons_broken': cartons,

            # Total litres moved from bulk to shelf
            'litres_moved': cartons * litres_per_carton,

            # Timestamp of operation
            'timestamp': datetime.now().isoformat(),

            # Note for auditors
            'note': 'Audit only - total inventory unchanged'
        }


# -------------------------------------------------------------------
# QUICK TEST SECTION
# -------------------------------------------------------------------
# This block runs only when this file is executed directly.
# It does NOT run when imported into another program.
# -------------------------------------------------------------------

if __name__ == "__main__":

    # Create an instance of the engine
    engine = InventoryEngine()

    # -----------------------------------------------------------
    # TEST CASE 1: Expected stock calculation
    # -----------------------------------------------------------
    state = InventoryState(
        sku_id="KINGS_5L",
        brand="King's Oil",
        size="5L",
        initial_stock=100,
        cartons_received=10,  # 10 cartons = 120 litres
        units_sold=85
    )

    expected = engine.calculate_expected(state)

    print(f"Expected Stock: {expected} litres")  # Should be 135


    # -----------------------------------------------------------
    # TEST CASE 2: Variance detection
    # -----------------------------------------------------------
    variance = engine.calculate_variance(expected, actual=132)

    print(
        f"Variance: {variance['variance']} "
        f"({variance['variance_pct']:.2f}%) - {variance['status']}"
    )


    # -----------------------------------------------------------
    # TEST CASE 3: Financial impact
    # -----------------------------------------------------------
    loss = engine.calculate_loss(variance['variance'], unit_price=25)

    print(f"Financial Loss: ${loss:,.2f}")


    # -----------------------------------------------------------
    # TEST CASE 4: Delivery validation
    # -----------------------------------------------------------
    delivery = engine.validate_delivery(
        ordered=100,
        received=98,
        unit_price=25
    )

    print(
        f"Delivery: {delivery['status']}, "
        f"Discrepancy: {delivery['discrepancy']}, "
        f"Impact: ${delivery['financial_impact']:,.2f}"
    )