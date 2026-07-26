"""Backend API tests for scooter workshop booking system."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ola-workshop-booking.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@workshop.com"
ADMIN_PASSWORD = "workshop123"


@pytest.fixture(scope="module")
def public_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# -------- Auth --------
class TestAuth:
    def test_login_success_sets_cookie(self, public_client):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        # httpOnly cookie must be set
        assert "access_token" in s.cookies.get_dict() or any(
            c.name == "access_token" for c in s.cookies
        )

    def test_login_wrong_password(self, public_client):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_authenticated(self, admin_client):
        r = admin_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_logout(self, admin_client):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200


# -------- Bookings public --------
class TestBookingPublic:
    def test_create_booking_public(self, public_client):
        payload = {
            "customer_name": "TEST_John",
            "place": "TEST_Bangalore",
            "phone": "9999999999",
            "scooter_brand": "Ola Electric",
            "scooter_model": "S1 Pro",
            "scooter_issue": "Battery not charging",
            "preferred_date": "2026-02-15",
        }
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["customer_name"] == payload["customer_name"]
        assert data["status"] == "Pending"
        assert "id" in data and data["id"]
        assert "_id" not in data
        pytest.booking_id = data["id"]


# -------- Bookings admin --------
class TestBookingAdmin:
    def test_list_requires_auth(self):
        r = requests.get(f"{API}/bookings")
        assert r.status_code == 401

    def test_stats_requires_auth(self):
        r = requests.get(f"{API}/bookings/stats")
        assert r.status_code == 401

    def test_patch_requires_auth(self):
        r = requests.patch(f"{API}/bookings/000000000000000000000000/status", json={"status": "Pending"})
        assert r.status_code == 401

    def test_list_bookings(self, admin_client):
        r = admin_client.get(f"{API}/bookings")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "id" in data[0]

    def test_stats(self, admin_client):
        r = admin_client.get(f"{API}/bookings/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ("total", "pending", "in_progress", "completed"):
            assert k in data

    def test_update_status_flow(self, admin_client):
        # Create own booking to avoid xdist worker isolation
        payload = {
            "customer_name": "TEST_Status", "place": "TEST_P", "phone": "9000000000",
            "scooter_brand": "Bajaj Chetak", "scooter_model": "X", "scooter_issue": "brakes",
            "preferred_date": "2026-03-01"}
        cr = requests.post(f"{API}/bookings", json=payload)
        bid = cr.json()["id"]
        # Get pre stats
        pre = admin_client.get(f"{API}/bookings/stats").json()
        r = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": "In Progress"})
        assert r.status_code == 200
        assert r.json()["status"] == "In Progress"
        # Verify persisted
        lst = admin_client.get(f"{API}/bookings").json()
        found = [b for b in lst if b["id"] == bid]
        assert found and found[0]["status"] == "In Progress"
        # Stats updated
        post = admin_client.get(f"{API}/bookings/stats").json()
        assert post["in_progress"] >= 1

        # Complete it
        r2 = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": "Completed"})
        assert r2.status_code == 200 and r2.json()["status"] == "Completed"

    def test_invalid_status(self, admin_client):
        payload = {
            "customer_name": "TEST_Inv", "place": "TEST_P", "phone": "9000000000",
            "scooter_brand": "TVS", "scooter_model": "X", "scooter_issue": "x",
            "preferred_date": "2026-03-01"}
        bid = requests.post(f"{API}/bookings", json=payload).json()["id"]
        r = admin_client.patch(f"{API}/bookings/{bid}/status", json={"status": "Bogus"})
        assert r.status_code == 400

    def test_nonexistent_booking(self, admin_client):
        r = admin_client.patch(f"{API}/bookings/000000000000000000000000/status", json={"status": "Pending"})
        assert r.status_code == 404
