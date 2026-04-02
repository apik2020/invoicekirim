import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    // Check that the page loaded
    await expect(page).toHaveTitle(/NotaBener/i)
  })

  test('should have navigation to login', async ({ page }) => {
    await page.goto('/')

    // Look for login link
    const loginLink = page.getByRole('link', { name: /login/i })
    await expect(loginLink).toBeVisible()
  })

  test('should have navigation to register', async ({ page }) => {
    await page.goto('/')

    // Look for register/signup link
    const registerLink = page.getByRole('link', { name: /register|sign up/i })
    await expect(registerLink).toBeVisible()
  })
})

test.describe('Health Check', () => {
  test('should return healthy status', async ({ page }) => {
    const response = await page.request.get('/api/health')

    expect(response.status()).toBe(200)

    const health = await response.json()
    expect(health).toHaveProperty('status')
    expect(health).toHaveProperty('timestamp')
    expect(health).toHaveProperty('checks')
  })
})

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login')

    // Check for email input
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()

    // Check for password input
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeVisible()

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /login|sign in/i })
    await expect(submitButton).toBeVisible()
  })
})
