import requests
BASE_URL = 'http://127.0.0.1:8000/api'
print("Testing Subscription endpoints")
response = requests.get(f"{BASE_URL}/subscription/plans")
print(f"Plans endpoint: {response.status_code}")


if response.status_code == 200:
    print("✅ Plans endpoint works!")
else:
    print(f"❌ Error: {response.text}")

# Test login
print("\nTesting login...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"username": "pintu", "password": "owner123"}
)
print(f"Login: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()['access']
    print(f"Access Token:{token}")

    # Test 3: Protected endpoint
    print("\nTesting protected endpoint...")
    headers = {"Authorization": f"Bearer {token}"}

    org_response = requests.get(
        f"{BASE_URL}/subscription/organisations/my-organisation",
        headers=headers
        

    )
    print(f"My Organization: {org_response}")
    if org_response.status_code == 200:
        print("✅ Organization endpoint works!")
        print(org_response.json())
    else:
        print(f"❌ Error: {org_response.text}")
else:
    print(f"❌ Login failed: {login_response.text}")