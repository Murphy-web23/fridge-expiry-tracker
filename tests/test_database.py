import tempfile
import unittest
from pathlib import Path

from src import database


class DatabasePriceTestCase(unittest.TestCase):
    def test_price_column_add_and_update(self) -> None:
        """確認新舊 SQLite 資料流程都能保存與更新購買金額。"""
        original_db_path = database.DB_PATH
        original_database_url = database.DATABASE_URL

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                database.DB_PATH = Path(temp_dir) / "fridge.db"
                database.DATABASE_URL = ""
                database.init_db()

                database.add_food(
                    family_code="demo-home",
                    name="測試鮮奶",
                    category="乳製品",
                    quantity="1 瓶",
                    price=95,
                    purchase_date="2026-07-25",
                    expiry_date="2026-07-30",
                    note="未開封",
                    added_by="Murphy",
                )
                food = database.get_all_foods("demo-home")[0]
                self.assertEqual(food["price"], 95)

                database.update_food(
                    food_id=food["id"],
                    family_code="demo-home",
                    name=food["name"],
                    category=food["category"],
                    quantity=food["quantity"],
                    price=105,
                    purchase_date=food["purchase_date"],
                    expiry_date=food["expiry_date"],
                    note=food["note"],
                    updated_by="NICK",
                )
                updated_food = database.get_all_foods("demo-home")[0]
                self.assertEqual(updated_food["price"], 105)
                self.assertEqual(updated_food["updated_by"], "NICK")
        finally:
            database.DB_PATH = original_db_path
            database.DATABASE_URL = original_database_url


if __name__ == "__main__":
    unittest.main()
