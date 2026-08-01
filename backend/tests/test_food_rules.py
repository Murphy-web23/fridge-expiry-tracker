import unittest
from datetime import date, timedelta

from app.food_rules import (
    adjust_quantity_text,
    calculate_days_left,
    status_label,
    with_calculated_fields,
)


class FoodRulesTestCase(unittest.TestCase):
    """v12 把期限與數量規則抽成純函式，這裡不用開資料庫就能測。"""

    def test_days_left_counts_from_today(self) -> None:
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        yesterday = (date.today() - timedelta(days=1)).isoformat()

        self.assertEqual(calculate_days_left(tomorrow), 1)
        self.assertEqual(calculate_days_left(date.today().isoformat()), 0)
        self.assertEqual(calculate_days_left(yesterday), -1)

    def test_status_label_rules(self) -> None:
        self.assertEqual(status_label("used", 30), "Used")
        self.assertEqual(status_label("active", -1), "Expired")
        self.assertEqual(status_label("active", 0), "Today")
        self.assertEqual(status_label("active", 7), "Soon")
        self.assertEqual(status_label("active", 8), "Safe")

    def test_calculated_fields_do_not_touch_the_original_food(self) -> None:
        food = {"expiry_date": (date.today() + timedelta(days=3)).isoformat(), "status": "active"}

        result = with_calculated_fields(food)

        self.assertEqual(result["days_left"], 3)
        self.assertEqual(result["status_label"], "Soon")
        self.assertNotIn("days_left", food)

    def test_quantity_keeps_the_unit_and_stops_at_zero(self) -> None:
        self.assertEqual(adjust_quantity_text("2 盒", -1), "1 盒")
        self.assertEqual(adjust_quantity_text("1 盒", -1), "0 盒")
        self.assertEqual(adjust_quantity_text("0 盒", -1), "0 盒")
        self.assertEqual(adjust_quantity_text("500 g", 1), "501 g")
        self.assertEqual(adjust_quantity_text("1.5 公斤", -1), "0.5 公斤")

    def test_quantity_without_a_leading_number_is_rejected(self) -> None:
        self.assertIsNone(adjust_quantity_text("未記錄", -1))
        self.assertIsNone(adjust_quantity_text("", 1))


if __name__ == "__main__":
    unittest.main()
