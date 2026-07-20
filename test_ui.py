from playwright.sync_api import sync_playwright
import time
import os

def wait_for_images(page):
    # Wait for all <img> tags to complete loading and have a natural width
    try:
        page.wait_for_function("""
            () => Array.from(document.querySelectorAll('img')).every(img => img.complete && img.naturalWidth > 0)
        """, timeout=15000)
    except Exception as e:
        print(f"Warning: image wait timeout or error: {e}")
    # Wait for the banner loading to disappear
    try:
        page.wait_for_selector('.home-banner-loading', state='hidden', timeout=10000)
    except Exception as e:
        pass
    # Wait extra time for animations/fade-ins
    time.sleep(2)

def capture_ui():
    print("Starting Playwright UI capture...")
    os.makedirs('screenshots', exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Listen to console errors
        def handle_console(msg):
            if msg.type == 'error' or msg.type == 'warning':
                print(f"[{msg.type.upper()}] {msg.text}")
        
        page.on("console", handle_console)
        
        # 1. Home
        print("Navigating to Home...")
        page.goto('http://localhost:5173')
        wait_for_images(page)
        page.screenshot(path='screenshots/home.png', full_page=True)
        print("Captured Home.")
        
        # 2. Login
        print("Navigating to Login...")
        page.goto('http://localhost:5173/login')
        wait_for_images(page)
        page.screenshot(path='screenshots/login.png', full_page=True)
        print("Captured Login.")
        
        # 3. Register
        print("Navigating to Register...")
        page.goto('http://localhost:5173/register')
        wait_for_images(page)
        page.screenshot(path='screenshots/register.png', full_page=True)
        print("Captured Register.")
        
        # 4. Attempt login as admin
        print("Logging in as Admin...")
        page.goto('http://localhost:5173/login')
        wait_for_images(page)
        page.fill('input[type="email"]', 'francoiglesias04@gmail.com')
        page.fill('input[type="password"]', 'Chavos123!')
        page.click('button[type="submit"]')
        
        # Wait for redirect to /my-account
        time.sleep(5)
        
        # 5. Go to admin panel
        print("Navigating to Admin Panel...")
        # Wait for the Panel Admin link to appear in the header and click it
        page.wait_for_selector('text="Panel Admin"', timeout=15000)
        page.click('text="Panel Admin"')
        
        # Wait for admin content
        try:
            page.wait_for_selector('.admin-content', timeout=10000)
            time.sleep(2)
        except Exception as e:
            print("Warning: admin content not found.")
            
        page.screenshot(path='screenshots/admin.png', full_page=True)
        print("Captured Admin.")
        
        browser.close()
        print("Done.")

if __name__ == '__main__':
    capture_ui()
