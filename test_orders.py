from playwright.sync_api import sync_playwright

def check_orders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Login User 1
        print("Logging in francoiglesias04@gmail.com...")
        page.goto('http://localhost:5173/login')
        page.fill('input[type="email"]', 'francoiglesias04@gmail.com')
        page.fill('input[type="password"]', 'Chavos123!')
        page.click('button[type="submit"]')
        page.wait_for_url('**/my-account', timeout=10000)
        page.wait_for_selector('.account-orders-list', timeout=15000)
        
        # count order items
        orders_franco = page.locator('.account-order-card').count()
        print(f"Franco's orders: {orders_franco}")
        page.click('.my-account-logout')

        # Login User 2
        print("Logging in chaos@test.com...")
        page.goto('http://localhost:5173/login')
        page.fill('input[type="email"]', 'chaos@test.com')
        page.fill('input[type="password"]', 'Test123!')
        page.click('button[type="submit"]')
        page.wait_for_url('**/my-account', timeout=10000)
        page.wait_for_selector('.account-orders-list', timeout=15000)
        
        # count order items
        orders_chaos = page.locator('.account-order-card').count()
        print(f"Chaos's orders: {orders_chaos}")

        browser.close()

if __name__ == '__main__':
    check_orders()
