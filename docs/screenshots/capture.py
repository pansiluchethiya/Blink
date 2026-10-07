"""Capture Blink screenshots: login, signup, chat. Saves to docs/screenshots/."""
import os, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
OUT = "/home/pansilu/blink/blink/docs/screenshots"
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/google-chrome",
        args=["--no-sandbox", "--force-device-scale-factor=1"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # 1. Login page (logged out)
    page.goto(BASE + "/login", wait_until="networkidle")
    page.wait_for_timeout(5000)  # let "session expired" toasts fade
    page.screenshot(path=f"{OUT}/login.png")

    # 2. Signup page
    page.goto(BASE + "/signup", wait_until="networkidle")
    page.wait_for_timeout(5000)
    page.screenshot(path=f"{OUT}/signup.png")

    # 3. Log in as demo user and screenshot the chat home
    page.goto(BASE + "/login", wait_until="networkidle")
    # fill by placeholder/label-agnostic selectors; adjust if needed
    email = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first
    pwd = page.locator('input[type="password"]').first
    email.fill("demo@blink.app")
    pwd.fill("blinkdemo123")
    page.locator('button[type="submit"]').first.click()
    page.wait_for_timeout(5000)  # login settles, toasts fade
    # open the Ava conversation so messages are visible
    page.get_by_text("Ava Silva").first.click()
    page.wait_for_timeout(2500)
    page.screenshot(path=f"{OUT}/chat.png", full_page=False)

    browser.close()
print("screenshots done:", sorted(os.listdir(OUT)))
