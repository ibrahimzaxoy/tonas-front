# Tonas Mobile App

## Project Overview
This is the mobile frontend for the Tonas Ecommerce platform, built with:
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context (Auth, Cart)
- **Styling**: Custom theme system

## Current Status
**Date**: Jan 20, 2026
**Phase**: Phase 4 (Authentication) - Debugging/Verification

We have implemented:
1.  **Navigation**: Full structure with Home, Categories, Cart, Wishlist, Profile.
2.  **Product Flow**: Category listing -> Product Details -> Add to Cart.
3.  **Authentication**: Login and Register screens connected to Laravel API.

## 🚨 Critical Action Items (For Next Session)

### 1. Fix CORS on Backend
The mobile app (running on `localhost:8081` or `127.0.0.1`) is being blocked by the Laravel backend. 
**Action**: You need to update your Laravel project's `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:8081', 'http://127.0.0.1:8081', '*'], // Add valid origins or * for dev
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```
Then clear cache: `php artisan config:clear`.

### 2. Verify Authentication Flow
Refactoring was done to use `AuthContext` in `LoginScreen.tsx` and `RegisterScreen.tsx`.
**Action**:
- Run the app.
- Register a NEW user (to avoid 422 duplicate email errors).
- Verify acceptable redirection to the Main screen.
- Verify the Profile tab shows the user's name.

## How to Run

1.  **Start the Backend**:
    Ensure your Laravel server is running on port 8000.
    ```bash
    php artisan serve --port=8000
    ```

2.  **Start the Mobile App**:
    ```bash
    cd "c:\Users\Ferminus\Desktop\tonas ecommerce\tonas-mobile"
    npx expo start --clear
    ```

## Project Structure
- `src/navigation`: App navigation configuration.
- `src/screens`: All screen components.
- `src/components`: Reusable UI components.
- `src/context`: Global state (AuthContext, CartContext).
- `src/services`: API configuration (`api.ts`) and endpoints (`endpoints.ts`).
- `src/theme`: Colors, spacing, and typography.

## Next Phase (Phase 5)
Once Authentication is verified, we will move to:
- **Checkout Flow**: Address selection, Payment integration, Order placement.
