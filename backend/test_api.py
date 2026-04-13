
from fastapi.testclient import TestClient
from main import app
import data_loader

data_loader.load_data()

client = TestClient(app)



client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["customers_in_memory"] > 0

def test_stats():
    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_recommendations" in data
    assert data["total_recommendations"] > 0

def test_recommendations_existing():
    # Get a customer_id from stats or health is hard, 
    # but we can try to find one if we have access to data_loader
    import data_loader
    customers = list(data_loader._lookup.keys())
    if not customers:
        raise Exception("No customers in memory")

    
    cid = customers[0]
    response = client.get(f"/recommendations/{cid}")
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == cid
    assert len(data["recommendations"]) > 0
    assert data["latency_ms"] < 10  # Performance goal

def test_recommendations_non_existing():
    response = client.get("/recommendations/NON_EXISTENT_CUST")
    assert response.status_code == 200
    data = response.json()
    assert data["recommendations"] == []

if __name__ == "__main__":
    try:
        print("Testing /health...")
        test_health()
        print("Testing /stats...")
        test_stats()
        print("Testing /recommendations (existing)...")
        test_recommendations_existing()
        print("Testing /recommendations (non-existing)...")
        test_recommendations_non_existing()
        print("All API tests passed!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"API tests failed: {e}")
        exit(1)

