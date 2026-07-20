from playwright.sync_api import sync_playwright
import time

def capture_admin():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Logging in as Admin...")
        page.goto('http://localhost:5173/login')
        time.sleep(2)
        page.fill('input[type="email"]', 'francoiglesias04@gmail.com')
        page.fill('input[type="password"]', 'Chavos123!')
        page.click('button[type="submit"]')
        
        # Wait for the account page
        page.wait_for_url('**/my-account', timeout=10000)
        print("Logged in, waiting for Firebase auth to sync in background...")
        time.sleep(3)
        
        # Click the Panel Admin button
        print("Going to Admin Panel...")
        page.goto('http://localhost:5173/admin')
        time.sleep(5)
        
        page.screenshot(path='screenshots/admin_real.png', full_page=True)
        print("Captured Admin.")
        browser.close()

if __name__ == '__main__':
    capture_admin()
