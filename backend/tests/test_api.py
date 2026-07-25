import unittest

from fastapi.testclient import TestClient

from app.main import app


class FoodApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_v10_food_workflow(self) -> None:
        """確認家庭選擇、金額、數量加減與標記使用可以完整串接。"""
        health = self.client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["version"], "v10")

        families = self.client.get("/families")
        self.assertEqual(families.status_code, 200)
        self.assertGreaterEqual(len(families.json()), 1)

        created = self.client.post(
            "/families/demo-home/foods",
            json={
                "name": "測試豆腐",
                "category": "其他",
                "storage_location": "常溫儲藏",
                "quantity": "2 盒",
                "price": 75,
                "purchase_date": "2026-07-25",
                "expiry_date": "2026-07-30",
                "note": "今晚煮湯",
                "added_by": "Murphy",
            },
        )
        self.assertEqual(created.status_code, 201)
        food = created.json()
        self.assertEqual(food["price"], 75)
        self.assertEqual(food["storage_location"], "常溫儲藏")

        quantity_updated = self.client.patch(
            f"/families/demo-home/foods/{food['id']}/quantity",
            json={"delta": -1, "updated_by": "NICK"},
        )
        self.assertEqual(quantity_updated.status_code, 200)
        self.assertEqual(quantity_updated.json()["quantity"], "1 盒")
        self.assertEqual(quantity_updated.json()["updated_by"], "NICK")

        marked_used = self.client.patch(
            f"/families/demo-home/foods/{food['id']}/status",
            json={"status": "used", "used_by": "NICK"},
        )
        self.assertEqual(marked_used.status_code, 200)
        self.assertEqual(marked_used.json()["status_label"], "Used")


if __name__ == "__main__":
    unittest.main()
