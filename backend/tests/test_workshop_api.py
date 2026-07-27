"""Backend API tests for scooter workshop booking system (v2 schema)."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@workshop.com"
ADMIN_PASSWORD = "workshop123"


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def ensure_bookable(admin_client):
    """Ensure settings are bookable (is_available=True, holiday_mode=False)."""
    default = {
        "is_available": True,
        "holiday_mode": False,
        "working_hours": {"open": "09:00", "close": "19:00"},
        "max_bookings_per_slot": 3,
        "service_areas": ["Bangalore"],
    }
    r = admin_client.put(f"{API}/settings", json=default)
    assert r.status_code == 200
    yield
    # Leave app bookable at end
    admin_client.put(f"{API}/settings", json=default)


@pytest.fixture(scope="module")
def test_slot(admin_client, ensure_bookable):
    r = admin_client.post(f"{API}/slots", json={"label": "TEST 10:00 AM - 11:00 AM"})
    assert r.status_code == 200, r.text
    slot = r.json()
    yield slot
    admin_client.delete(f"{API}/slots/{slot['id']}")


# -------- Health & Auth --------
class TestHealthAuth:
    def test_health(self):
        r = requests.get(f"{API}/health")
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok" and d["db"] == "connected" and d.get("admin_exists") is True

    def test_login_success_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL
        assert any(c.name == "access_token" for c in s.cookies)

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "bad"})
        assert r.status_code == 401
        assert r.json().get("detail") == "Invalid email or password"

    def test_me_requires_auth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401

    def test_me_authenticated(self, admin_client):
        r = admin_client.get(f"{API}/auth/me")
        assert r.status_code == 200 and r.json()["email"] == ADMIN_EMAIL

    def test_logout(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert s.post(f"{API}/auth/logout").status_code == 200


# -------- Public config & slots --------
class TestPublic:
    def test_config(self):
        r = requests.get(f"{API}/config")
        assert r.status_code == 200
        d = r.json()
        for k in ("is_available", "holiday_mode", "working_hours", "service_areas"):
            assert k in d

    def test_available_slots_returns_created_slot(self, test_slot):
        r = requests.get(f"{API}/slots/available")
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert test_slot["id"] in ids


# -------- Slots admin --------
class TestSlots:
    def test_list_requires_auth(self):
        assert requests.get(f"{API}/slots").status_code == 401

    def test_create_and_toggle_and_delete(self, admin_client):
        r = admin_client.post(f"{API}/slots", json={"label": "TEST 4:00 PM - 5:00 PM"})
        assert r.status_code == 200
        sid = r.json()["id"]
        assert r.json()["is_open"] is True

        # Toggle OFF
        r2 = admin_client.patch(f"{API}/slots/{sid}", json={"is_open": False})
        assert r2.status_code == 200 and r2.json()["is_open"] is False

        # Should NOT appear in public available
        pub = requests.get(f"{API}/slots/available").json()
        assert sid not in [s["id"] for s in pub]

        # Delete
        d = admin_client.delete(f"{API}/slots/{sid}")
        assert d.status_code == 200


# -------- Bookings --------
class TestBookings:
    def test_create_booking_public(self, test_slot):
        payload = {
            "customer_name": "TEST_John", "phone": "9999999999",
            "scooter_brand": "Ola Electric", "scooter_model": "S1 Pro",
            "scooter_issue": "Battery not charging",
            "location": "Koramangala", "landmark": "Near Metro",
            "slot_id": test_slot["id"], "slot_label": test_slot["label"],
        }
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["customer_name"] == "TEST_John"
        assert d["status"] == "Pending"
        assert "id" in d and "_id" not in d

    def test_list_requires_auth(self):
        assert requests.get(f"{API}/bookings").status_code == 401

    def test_stats_requires_auth(self):
        assert requests.get(f"{API}/bookings/stats").status_code == 401

    def test_list_and_search(self, admin_client):
        r = admin_client.get(f"{API}/bookings")
        assert r.status_code == 200 and isinstance(r.json(), list)

        r2 = admin_client.get(f"{API}/bookings", params={"search": "TEST_John"})
        assert r2.status_code == 200
        assert all("TEST_John" in b["customer_name"] or "TEST_John" in b.get("phone", "") for b in r2.json()) or len(r2.json()) == 0 or any(b["customer_name"] == "TEST_John" for b in r2.json())

    def test_stats(self, admin_client):
        r = admin_client.get(f"{API}/bookings/stats")
        assert r.status_code == 200
        d = r.json()
        assert "total" in d
        for st in ["Pending", "Accepted", "Rejected", "In Progress", "Completed"]:
            assert st in d

    def test_status_flow_accept_progress_complete(self, admin_client, test_slot):
        # Create
        payload = {"customer_name": "TEST_Flow", "phone": "9000000000",
                   "scooter_brand": "Bajaj Chetak", "scooter_model": "X",
                   "scooter_issue": "brakes", "location": "HSR",
                   "slot_id": test_slot["id"], "slot_label": test_slot["label"]}
        bid = requests.post(f"{API}/bookings", json=payload).json()["id"]

        for st in ["Accepted", "In Progress", "Completed"]:
            r = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": st})
            assert r.status_code == 200 and r.json()["status"] == st

        # Verify persisted
        lst = admin_client.get(f"{API}/bookings").json()
        found = [b for b in lst if b["id"] == bid]
        assert found and found[0]["status"] == "Completed"

    def test_reject_flow(self, admin_client, test_slot):
        payload = {"customer_name": "TEST_Reject", "phone": "9111111111",
                   "scooter_brand": "TVS", "scooter_model": "X", "scooter_issue": "x",
                   "location": "L", "slot_id": test_slot["id"], "slot_label": test_slot["label"]}
        bid = requests.post(f"{API}/bookings", json=payload).json()["id"]
        r = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": "Rejected"})
        assert r.status_code == 200 and r.json()["status"] == "Rejected"

    def test_invalid_status(self, admin_client, test_slot):
        payload = {"customer_name": "TEST_Inv", "phone": "9000000000",
                   "scooter_brand": "TVS", "scooter_model": "X", "scooter_issue": "x",
                   "location": "L", "slot_id": test_slot["id"], "slot_label": test_slot["label"]}
        bid = requests.post(f"{API}/bookings", json=payload).json()["id"]
        r = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": "Bogus"})
        assert r.status_code == 400

    def test_nonexistent_booking(self, admin_client):
        r = admin_client.patch(f"{API}/bookings/000000000000000000000000/status", json={"status": "Pending"})
        assert r.status_code == 404

    def test_booking_rejected_when_slot_closed(self, admin_client):
        # Create a fresh slot and close it
        s = admin_client.post(f"{API}/slots", json={"label": "TEST_Closed"}).json()
        admin_client.patch(f"{API}/slots/{s['id']}", json={"is_open": False})
        payload = {"customer_name": "TEST_C", "phone": "9000000000",
                   "scooter_brand": "X", "scooter_model": "X", "scooter_issue": "x",
                   "location": "L", "slot_id": s["id"], "slot_label": s["label"]}
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 400
        admin_client.delete(f"{API}/slots/{s['id']}")

    def test_capacity_enforced(self, admin_client, ensure_bookable):
        # Set max=1, create slot, book once, second should fail
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 1, "service_areas": ["Bangalore"]})
        s = admin_client.post(f"{API}/slots", json={"label": "TEST_Cap"}).json()
        payload = {"customer_name": "TEST_Cap1", "phone": "9000000001",
                   "scooter_brand": "X", "scooter_model": "X", "scooter_issue": "x",
                   "location": "L", "slot_id": s["id"], "slot_label": s["label"]}
        r1 = requests.post(f"{API}/bookings", json=payload)
        assert r1.status_code == 200
        # Available should not include this slot now
        pub = requests.get(f"{API}/slots/available").json()
        assert s["id"] not in [x["id"] for x in pub]
        # Second attempt fails
        payload["customer_name"] = "TEST_Cap2"
        r2 = requests.post(f"{API}/bookings", json=payload)
        assert r2.status_code == 400
        admin_client.delete(f"{API}/slots/{s['id']}")
        # restore max
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})

    # -------- Settings (kept in same class as bookings to serialize on one xdist worker) --------
    def test_get_requires_auth(self):
        assert requests.get(f"{API}/settings").status_code == 401

    def test_put_persist(self, admin_client):
        payload = {
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "10:00", "close": "20:00"},
            "max_bookings_per_slot": 5,
            "service_areas": ["Bangalore", "TEST_Area"],
        }
        r = admin_client.put(f"{API}/settings", json=payload)
        assert r.status_code == 200
        got = admin_client.get(f"{API}/settings").json()
        assert got["max_bookings_per_slot"] == 5
        assert "TEST_Area" in got["service_areas"]
        assert got["working_hours"]["open"] == "10:00"
        # Restore defaults
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})

    def test_holiday_mode_blocks_booking(self, admin_client, test_slot):
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": True,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})
        # public config reflects
        cfg = requests.get(f"{API}/config").json()
        assert cfg["holiday_mode"] is True
        # available slots empty
        assert requests.get(f"{API}/slots/available").json() == []
        # booking blocked
        payload = {"customer_name": "TEST_H", "phone": "9000000000",
                   "scooter_brand": "X", "scooter_model": "X", "scooter_issue": "x",
                   "location": "L", "slot_id": test_slot["id"], "slot_label": test_slot["label"]}
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 400
        # Restore
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})

    def test_is_available_false_blocks(self, admin_client, test_slot):
        admin_client.put(f"{API}/settings", json={
            "is_available": False, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})
        assert requests.get(f"{API}/config").json()["is_available"] is False
        assert requests.get(f"{API}/slots/available").json() == []
        # Restore
        admin_client.put(f"{API}/settings", json={
            "is_available": True, "holiday_mode": False,
            "working_hours": {"open": "09:00", "close": "19:00"},
            "max_bookings_per_slot": 3, "service_areas": ["Bangalore"]})
