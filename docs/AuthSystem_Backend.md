# Backend Authentication System Overview

## Overview of the Authentication Flow
The backend authentication system is designed to provide secure and efficient user management for the application. It leverages Supabase for authentication and database functionality while integrating robust security measures such as cookie-based token storage and input validation.

---

## Server Setup
- **Framework:** The application uses Express.js as the backend framework.
- **CORS Support:** CORS is enabled to allow secure cross-origin resource sharing.
- **Cookie Support:** Cookies are utilized to store refresh tokens securely.
- **Routing:** Authentication routes are mounted under the `/auth/*` namespace.

---

## Authentication Routes
### Endpoints
- **POST `/register`:** Registers a new user.
- **POST `/login`:** Authenticates a user and issues tokens.
- **POST `/resend-confirmation`:** Resends the email confirmation link.
- **POST `/refresh-token`:** Refreshes the access token using the refresh token.
- **POST `/logout`:** Clears the refresh token cookie.

### Key Features
1. **Registration Flow:**
   - User submits `name`, `email`, and `password`.
   - Validates the input (e.g., name length, email format, password complexity).
   - Creates the user in Supabase Auth and stores additional data in the `users` table.
   - Supabase handles email confirmation automatically.

2. **Login Flow:**
   - User submits `email` and `password`.
   - Authenticates against Supabase.
   - Returns:
     - Short-lived access token in the response body.
     - Long-lived refresh token in an HTTP-only cookie.
     - User profile data.

3. **Token Management:**
   - **Access Token:** A short-lived JWT sent in the `Authorization` header.
   - **Refresh Token:** Stored in an HTTP-only cookie with a 30-day expiry.
   - Token refresh endpoint issues new access tokens.

4. **Security Features:**
   - **Password Security:** Supabase enforces password complexity and secure hashing.
   - **Cookie Security:** Cookies are HTTP-only, secure, and have a `sameSite` policy.

5. **Protected Routes:**
   - Middleware verifies JWT tokens and adds user data to the request object.

---

## Key Middleware and Utilities

### Token Authentication Middleware
- Extracts and verifies JWT from the `Authorization` header.
- Fetches user data from Supabase and appends it to the request object.
- Responds with `401 Unauthorized` for invalid or missing tokens.

### Admin Access Middleware (Optional)
- Validates if the authenticated user has admin rights in a specific workspace.
- Responds with `403 Forbidden` if the user lacks admin privileges.

---

## Implementation Details

### Controllers
#### `authController`
- **`register(req, res):`** Handles user registration with input validation and Supabase integration.
- **`login(req, res):`** Authenticates the user and sets the refresh token in an HTTP-only cookie.
- **`resendConfirmation(req, res):`** Resends the confirmation email if needed.
- **`refreshToken(req, res):`** Issues a new access token using a valid refresh token.
- **`logout(req, res):`** Clears the refresh token cookie upon logout.

### Services
#### `authService`
- **`registerUser(name, email, password):`**
  - Validates user input.
  - Creates a new user in Supabase Auth.
  - Saves user data to the `users` table.
- **`loginUser(email, password):`**
  - Authenticates the user via Supabase Auth.
  - Fetches user data from the `users` table.
  - Returns session tokens and user profile.
- **`resendConfirmationEmail(email):`** Sends a new email confirmation link.
- **`refreshToken(token):`** Verifies and refreshes session tokens.

### Validation Utilities
- **`validateName(name):`** Ensures the name is between 2 and 50 characters.
- **`validateEmail(email):`** Checks the email format.
- **`validatePassword(password):`** Ensures passwords meet complexity requirements.

### Supabase Configuration
- **Client:** Configured with environment variables (`SUPABASE_URL`, `SUPABASE_KEY`).
- **Storage:** Configured with environment variables (`SUPABASE_FILE_STORAGE_TABLE`).
- **Service:** Configured with environment variables (`SUPABASE_SERVICE_ROLE_KEY`).
- **Usage:** Utilized for user authentication and database interactions.

---

## Security Highlights
- **Token Security:**
  - Short-lived access tokens reduce exposure.
  - Refresh tokens stored in secure HTTP-only cookies.
- **Input Validation:** Prevents injection attacks and ensures data integrity.
- **Error Handling:** Centralized error handling with `AppError` class for consistent responses.

---

## Future Enhancements
- Implement rate limiting on authentication endpoints to mitigate abuse.
- Add MFA (Multi-Factor Authentication) for enhanced security.
- Support social logins for easier onboarding.
- Log and monitor authentication events for auditing purposes.

---

This backend authentication system ensures a secure, efficient, and user-friendly experience while maintaining extensibility for future updates.

