
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def csrf_headers(client: TestClient) -> dict[str, str]:
    response = client.get("/auth/csrf")
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrf_token"]}


def register(client: TestClient) -> str:
    email = f"{uuid4().hex}@example.com"
    response = client.post(
        "/auth/register",
        json={"email": email, "password": "SecurePassword123!"},
        headers=csrf_headers(client),
    )
    assert response.status_code == 201, response.text
    assert "taskflow_access_token" in response.cookies
    return email


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_tasks_require_authentication():
    with TestClient(app) as anonymous:
        response = anonymous.get("/tasks/")
        assert response.status_code == 401

        response = anonymous.post(
            "/tasks/",
            json={"title": "Unauthorized task"},
            headers=csrf_headers(anonymous),
        )
        assert response.status_code == 401


def test_register_login_and_logout():
    with TestClient(app) as user_client:
        email = register(user_client)

        response = user_client.get("/auth/me")
        assert response.status_code == 200
        assert response.json()["email"] == email

        response = user_client.post(
            "/auth/logout",
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 204

        response = user_client.get("/auth/me")
        assert response.status_code == 401

        response = user_client.post(
            "/auth/login",
            json={"email": email, "password": "SecurePassword123!"},
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 200

        response = user_client.get("/auth/me")
        assert response.status_code == 200


def test_duplicate_registration():
    with TestClient(app) as user_client:
        email = register(user_client)
        user_client.post(
            "/auth/logout",
            headers=csrf_headers(user_client),
        )

        response = user_client.post(
            "/auth/register",
            json={"email": email, "password": "AnotherPassword123!"},
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 409


def test_task_crud():
    with TestClient(app) as user_client:
        register(user_client)

        response = user_client.post(
            "/tasks/",
            json={
                "title": "Learn Docker Compose",
                "description": "Practice CRUD operations",
            },
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 201, response.text
        task = response.json()
        task_id = task["id"]
        assert task["title"] == "Learn Docker Compose"
        assert task["is_completed"] is False

        response = user_client.get(f"/tasks/{task_id}")
        assert response.status_code == 200

        response = user_client.patch(
            f"/tasks/{task_id}",
            json={"is_completed": True},
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 200
        assert response.json()["is_completed"] is True

        response = user_client.delete(
            f"/tasks/{task_id}",
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 204

        assert user_client.get(f"/tasks/{task_id}").status_code == 404


def test_users_cannot_access_each_others_tasks():
    with TestClient(app) as alice, TestClient(app) as bob:
        register(alice)
        register(bob)

        response = alice.post(
            "/tasks/",
            json={"title": "Alice private task"},
            headers=csrf_headers(alice),
        )
        assert response.status_code == 201, response.text
        task_id = response.json()["id"]

        assert bob.get("/tasks/").json() == []
        assert bob.get(f"/tasks/{task_id}").status_code == 404

        response = bob.patch(
            f"/tasks/{task_id}",
            json={"title": "Stolen task"},
            headers=csrf_headers(bob),
        )
        assert response.status_code == 404

        response = bob.delete(
            f"/tasks/{task_id}",
            headers=csrf_headers(bob),
        )
        assert response.status_code == 404

        response = alice.get(f"/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Alice private task"


def test_sql_injection_like_text_is_stored_as_text():
    with TestClient(app) as user_client:
        register(user_client)
        payload = "'; DROP TABLE tasks; --"

        response = user_client.post(
            "/tasks/",
            json={"title": payload},
            headers=csrf_headers(user_client),
        )
        assert response.status_code == 201, response.text
        assert response.json()["title"] == payload

        response = user_client.get("/tasks/")
        assert response.status_code == 200
        assert any(task["title"] == payload for task in response.json())


def test_task_not_found():
    with TestClient(app) as user_client:
        register(user_client)
        response = user_client.get("/tasks/999999999")
        assert response.status_code == 404


def test_csrf_rejects_missing_token():
    with TestClient(app) as user_client:
        response = user_client.post(
            "/auth/register",
            json={
                "email": f"{uuid4().hex}@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert response.status_code == 403
