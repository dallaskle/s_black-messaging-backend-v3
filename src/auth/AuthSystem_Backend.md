# Auth Folder Structure

## 📁 Folder Contents

### 1. `authRoutes.ts`
- **Purpose:** Main router configuration for all authentication endpoints.
- **Defined Routes:**
  - `POST /register`: New user registration.
  - `POST /login`: User authentication.
  - `POST /resend-confirmation`: Resend email confirmation.
  - `POST /refresh-token`: Refresh expired access tokens.
  - `POST /logout`: User logout.

### 2. Controllers

#### `loginController.ts`
- **Handles:** User login requests.
- **Key Features:**
  - Extracts `email` and `password` from request body.
  - Uses `loginService` to authenticate user.
  - Sets HTTP-only refresh token cookie (30 days expiry).
  - **Returns:**
    - User data.
    - Access token.
  - **Error Handling:**
    - Catches `AppError` and generic errors.

#### `logoutController.ts`
- **Handles:** Logout requests.
- **Key Features:**
  - Clears the refresh token cookie.
  - Uses same cookie parameters as `loginController` for consistency.
  - **Returns:** Success message.
  - Basic error handling.

#### `refreshTokenController.ts`
- **Handles:** Access token refresh requests.
- **Key Features:**
  - Extracts refresh token from cookies.
  - Validates token presence.
  - Gets new tokens from `tokenService`.
  - Sets new refresh token cookie.
  - **Returns:**
    - Updated user data.
    - New access token.
  - Comprehensive error handling.

#### `registerController.ts`
- **Handles:** New user registration.
- **Key Features:**
  - Extracts `name`, `email`, and `password` from request body.
  - Includes detailed logging for debugging.
  - **Returns:** Newly created user data.
  - Comprehensive error handling with status codes.

#### `resendConfirmationController.ts`
- **Handles:** Email confirmation resend requests.
- **Key Features:**
  - Validates email presence.
  - Uses `confirmationService`.
  - **Returns:** Success message.
  - Proper error handling.

### 3. Services

#### `confirmationService.ts`
- **Purpose:** Handles email confirmation resend logic.
- **Key Features:**
  - Uses Supabase `auth.signUp` with dummy password.
  - Logs success/failure.
  - Handles "already registered" case.

#### `loginService.ts`
- **Purpose:** Core authentication logic.
- **Key Steps:**
  1. Authenticates with Supabase.
  2. Validates auth response.
  3. Fetches additional user profile data.
  4. Returns combined session and user data.
- **Error Handling:**
  - Detailed error logging.
  - Comprehensive error handling.

#### `registerService.ts`
- **Purpose:** Handles new user creation.
- **Input Validation:**
  - `Name`: 2-50 characters.
  - `Email`: Valid format.
  - `Password`: 8+ characters, uppercase, lowercase, number, special char.
- **Registration Flow:**
  - Validates input.
  - Creates Supabase auth user.
  - Creates/updates user profile.
  - Includes detailed logging and error handling.

#### `tokenService.ts`
- **Purpose:** Handles JWT token operations.
- **Functions:**
  1. `createToken`: Creates new JWT with user ID.
  2. `refreshToken`: Refreshes session via Supabase.
     - Fetches updated user data.
     - Returns new tokens and user data.

---

## 🔑 Key Security Features
- HTTP-only cookies for refresh tokens.
- Secure cookie settings in production.
- Strict same-site cookie policy.
- Comprehensive input validation.
- Proper error handling and status codes.
- Separation of concerns between controllers and services.

---

## 📝 Error Handling
- **Custom `AppError` Class:** Used throughout the application.
- **Error Responses:**
  - Specific error messages and status codes.
  - Proper error logging.
  - Production-safe error responses.

---

## 🔄 Authentication Flow
1. **User Registers:**
   - Receives confirmation email.
2. **User Logs In:**
   - Receives access token and refresh token.
3. **Access Token Expires:**
   - Refresh token is used to obtain a new pair of tokens.
4. **User Logs Out:**
   - Refresh token is cleared.

---

This implementation follows security best practices and provides a robust authentication system using Supabase as the backend authentication provider.