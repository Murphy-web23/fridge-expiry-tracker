import unittest

from fastapi.testclient import TestClient

from app.main import app


BASE_FOOD = {
    "name": "測試豆腐",
    "category": "其他",
    "storage_location": "常溫儲藏",
    "quantity": "2 盒",
    "price": 75,
    "purchase_date": "2026-07-25",
    "expiry_date": "2026-07-30",
    "note": "今晚煮湯",
}


class FoodApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def create_food(self, **overrides) -> dict:
        payload = {**BASE_FOOD, "added_by": "Murphy", **overrides}
        response = self.client.post("/families/demo-home/foods", json=payload)
        self.assertEqual(response.status_code, 201)
        return response.json()

    def tearDown(self) -> None:
        """測試會直接改動 mock data，結束後把新增的測試食材清掉。"""
        for food in self.client.get("/families/demo-home/foods").json():
            if food["name"].startswith("測試"):
                self.client.delete(f"/families/demo-home/foods/{food['id']}")

    def test_food_workflow(self) -> None:
        """確認家庭選擇、金額、數量加減與標記使用可以完整串接。"""
        health = self.client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["version"], "v11.2")

        families = self.client.get("/families")
        self.assertEqual(families.status_code, 200)
        self.assertGreaterEqual(len(families.json()), 1)

        food = self.create_food()
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

    def test_update_food_replaces_every_editable_field(self) -> None:
        """v11.2 編輯視窗會一次送出所有欄位，包含儲存位置。"""
        food = self.create_food()

        updated = self.client.put(
            f"/families/demo-home/foods/{food['id']}",
            json={
                "name": "測試嫩豆腐",
                "category": "乳製品",
                "storage_location": "冰箱冷藏",
                "quantity": "5 盒",
                "price": 40,
                "purchase_date": "2026-07-26",
                "expiry_date": "2026-08-05",
                "note": "改成明天煮",
                "updated_by": "NICK",
            },
        )
        self.assertEqual(updated.status_code, 200)
        result = updated.json()
        self.assertEqual(result["id"], food["id"])
        self.assertEqual(result["name"], "測試嫩豆腐")
        self.assertEqual(result["category"], "乳製品")
        self.assertEqual(result["storage_location"], "冰箱冷藏")
        self.assertEqual(result["quantity"], "5 盒")
        self.assertEqual(result["price"], 40)
        self.assertEqual(result["expiry_date"], "2026-08-05")
        self.assertEqual(result["note"], "改成明天煮")
        self.assertEqual(result["updated_by"], "NICK")
        self.assertEqual(result["added_by"], "Murphy")
        self.assertIsNotNone(result["updated_at"])

    def test_update_food_rejects_expiry_before_purchase(self) -> None:
        food = self.create_food()

        response = self.client.put(
            f"/families/demo-home/foods/{food['id']}",
            json={
                **BASE_FOOD,
                "purchase_date": "2026-07-25",
                "expiry_date": "2026-07-20",
                "updated_by": "NICK",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_update_missing_food_returns_404(self) -> None:
        response = self.client.put(
            "/families/demo-home/foods/999999",
            json={**BASE_FOOD, "updated_by": "NICK"},
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_food_removes_it_from_the_list(self) -> None:
        food = self.create_food()

        deleted = self.client.delete(f"/families/demo-home/foods/{food['id']}")
        self.assertEqual(deleted.status_code, 204)

        remaining_ids = [item["id"] for item in self.client.get("/families/demo-home/foods").json()]
        self.assertNotIn(food["id"], remaining_ids)

        self.assertEqual(self.client.delete(f"/families/demo-home/foods/{food['id']}").status_code, 404)

    def test_quantity_reaching_zero_marks_food_as_used(self) -> None:
        """數量歸零代表用完，狀態自動變成已使用。"""
        food = self.create_food(quantity="1 盒")

        emptied = self.client.patch(
            f"/families/demo-home/foods/{food['id']}/quantity",
            json={"delta": -1, "updated_by": "NICK"},
        )
        self.assertEqual(emptied.status_code, 200)
        self.assertEqual(emptied.json()["quantity"], "0 盒")
        self.assertEqual(emptied.json()["status"], "used")
        self.assertEqual(emptied.json()["status_label"], "Used")
        self.assertEqual(emptied.json()["used_by"], "NICK")

    def test_quantity_back_above_zero_returns_to_active(self) -> None:
        """補貨後數量大於零，狀態要回到可使用。"""
        food = self.create_food(quantity="1 盒")
        self.client.patch(
            f"/families/demo-home/foods/{food['id']}/quantity",
            json={"delta": -1, "updated_by": "NICK"},
        )

        restocked = self.client.patch(
            f"/families/demo-home/foods/{food['id']}/quantity",
            json={"delta": 1, "updated_by": "Murphy"},
        )
        self.assertEqual(restocked.status_code, 200)
        self.assertEqual(restocked.json()["quantity"], "1 盒")
        self.assertEqual(restocked.json()["status"], "active")
        self.assertIsNone(restocked.json()["used_by"])

    def test_quantity_never_drops_below_zero(self) -> None:
        food = self.create_food(quantity="1 盒")
        for _ in range(3):
            response = self.client.patch(
                f"/families/demo-home/foods/{food['id']}/quantity",
                json={"delta": -1, "updated_by": "NICK"},
            )
            self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["quantity"], "0 盒")

    def test_quantity_without_number_cannot_be_adjusted(self) -> None:
        food = self.create_food(quantity="未記錄")

        response = self.client.patch(
            f"/families/demo-home/foods/{food['id']}/quantity",
            json={"delta": -1, "updated_by": "NICK"},
        )
        self.assertEqual(response.status_code, 400)

    def test_quantity_on_missing_food_returns_404(self) -> None:
        response = self.client.patch(
            "/families/demo-home/foods/999999/quantity",
            json={"delta": -1, "updated_by": "NICK"},
        )
        self.assertEqual(response.status_code, 404)

    def test_unknown_family_returns_404(self) -> None:
        self.assertEqual(self.client.get("/families/no-such-home/foods").status_code, 404)
        self.assertEqual(self.client.delete("/families/no-such-home/foods/1").status_code, 404)


if __name__ == "__main__":
    unittest.main()
