# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## FTW-101 Payment Flow (PayHere + Mock)

This frontend supports customer advance payment initiation using a backend-generated gateway payload. It works for both real PayHere redirect form-post and mock checkout redirect.

### Implemented Pages/Flows

- `Pay Advance` action in customer active reservations (`/profile`)
- Redirect-based gateway post using backend payload fields
- Success return page: `/payment/success`
- Failure/cancel return page: `/payment/fail`

### Backend Contract Expected

`POST /api/v1/bookings/{bookingId}/payments/initiate`

Expected shape:

```ts
type InitiatePaymentResponsePayHere = {
  gateway: 'PAYHERE';
  orderId: string;
  payhereUrl: string;
  fields: Record<string, string>;
};

type InitiatePaymentResponseMock = {
  gateway: 'MOCK';
  orderId: string;
  redirectUrl: string;
};

type InitiatePaymentResponse = InitiatePaymentResponsePayHere | InitiatePaymentResponseMock;
```

### Manual Sandbox Test Steps

1. Start frontend:

```bash
npm install
npm run dev
```

2. Ensure `VITE_API_BASE_URL` points to backend where payment initiate endpoint is available.
3. Login as a customer and open `/profile`.
4. Pick an active booking and click `Pay Advance`.
5. If backend returns `gateway = PAYHERE`, verify browser is redirected to PayHere checkout using an auto-submitted hidden POST form.
6. If backend returns `gateway = MOCK`, verify browser redirects to the mock checkout URL (`redirectUrl`) using normal redirect.
7. Complete payment (sandbox or mock):
  - Success path should return to `/payment/success?bookingId=<id>`.
  - Page shows `Payment successful (pending confirmation)...` and polls booking status every 2s for up to 30s.
8. Cancel/fail payment:
  - Return should land on `/payment/fail?bookingId=<id>`.
  - Page shows retry action and latest booking/payment status.

### Notes

- Backend verification/webhook handling is intentionally not implemented in frontend.
- Frontend is gateway-agnostic. It never builds merchant fields or hashes; it only redirects/posts values returned by backend.
