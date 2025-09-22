# react-enterprise-recaptcha

A lightweight **reCAPTCHA Enterprise** wrapper for React with a **next-recaptcha-v3–compatible** API.
Framework-agnostic (no Next.js dependency) and client-only.

- `ReCaptchaProvider` — loads the Enterprise script and provides context
- `useReCaptcha()` — returns `{ executeRecaptcha(action?), isLoaded, isError, error, defaultAction }`
- `<ReCaptcha />` — convenience component that runs on mount / when `refreshReCaptcha` changes
- `withReCaptcha()` — HOC that injects `{ isLoaded, executeRecaptcha }`
- **Default action support** via props or env (`NEXT_PUBLIC_RECAPTCHA_ACTION` / `RECAPTCHA_ACTION`)
- Enterprise-only (uses `https://www.google.com/recaptcha/enterprise.js`)

> ⚠️ This library targets **reCAPTCHA Enterprise**. It does not load or polyfill the non-Enterprise API.

---

## Install

```bash
npm i react-enterprise-recaptcha
# or
yarn add react-enterprise-recaptcha
# or
pnpm add react-enterprise-recaptcha
````

**Peer deps:** React ≥ 17

---

## Quick Start

```tsx
import { ReCaptchaProvider, useReCaptcha, ReCaptcha } from "react-enterprise-recaptcha";

function App() {
  return (
    <ReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      language="en"
      defaultAction="login"              // used when executeRecaptcha() is called without an action
    >
      <Login />
    </ReCaptchaProvider>
  );
}

function Login() {
  const { executeRecaptcha } = useReCaptcha();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Uses provider's defaultAction ("login")
    const token = await executeRecaptcha();
    await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  };

  return <form onSubmit={onSubmit}>{/* ... */}</form>;
}

// Optional convenience component:
function PageView() {
  return (
    <ReCaptcha
      action="page_view"
      onValidate={(token) => console.log(token)}
      refreshReCaptcha={Date.now()}   // re-run when this value changes
    />
  );
}
```

---

## API

### `<ReCaptchaProvider />`

Wrap your app with the provider. It injects the Enterprise script and exposes context.

| Prop              | Type      | Default | Description                                              |
| ----------------- | --------- | ------- | -------------------------------------------------------- |
| `reCaptchaKey`    | `string`  | —       | Your **Enterprise** site key                             |
| `language`        | `string`  | —       | UI language (e.g. `"en"`, `"ja"`)                        |
| `useRecaptchaNet` | `boolean` | `false` | Load from `recaptcha.net` (e.g. mainland China)          |
| `nonce`           | `string`  | —       | CSP nonce for the injected `<script>`                    |
| `defaultAction`   | `string`  | —       | Default action for `executeRecaptcha()`                  |
| `reCaptchaAction` | `string`  | —       | Alias of `defaultAction` (naming parity)                 |
| `useEnterprise`   | `boolean` | `true`  | Kept for API compatibility; always treated as Enterprise |

**Environment variables** (used if props are not provided):

* `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
* `NEXT_PUBLIC_RECAPTCHA_ACTION` or `RECAPTCHA_ACTION`

Priority: `props > NEXT_PUBLIC_RECAPTCHA_ACTION > RECAPTCHA_ACTION`.

---

### `useReCaptcha()`

Hook that gives you access to the context.

```ts
type UseReCaptcha = () => {
  reCaptchaKey?: string;
  grecaptcha?: any; // raw global for advanced usage
  isLoaded: boolean;
  isError: boolean;
  error: Error | null;
  defaultAction?: string;
  executeRecaptcha: (action?: string) => Promise<string>;
};
```

* `executeRecaptcha(action?)`: If `action` is omitted, the provider’s `defaultAction` (or env) is used.

---

### `<ReCaptcha />` (optional)

Convenience component that executes on mount and when `refreshReCaptcha` changes, calling `onValidate(token)`.

| Prop               | Type                      | Required | Description                         |
| ------------------ | ------------------------- | -------- | ----------------------------------- |
| `onValidate`       | `(token: string) => void` | ✔︎       | Receives the token                  |
| `action`           | `string`                  | —        | Uses provider default if omitted    |
| `refreshReCaptcha` | `any`                     | —        | Re-executes when this value changes |
| `onError`          | `(err: unknown) => void`  | —        | Called on failure                   |

---

### `withReCaptcha(Component)`

Higher-order component that injects `{ isLoaded, executeRecaptcha(action?) }` into your component.

```tsx
import { withReCaptcha } from "react-enterprise-recaptcha";

function VerifyButton({ isLoaded, executeRecaptcha }: {
  isLoaded: boolean; executeRecaptcha: (a?: string) => Promise<string>;
}) {
  return (
    <button
      disabled={!isLoaded}
      onClick={async () => {
        const token = await executeRecaptcha("button_click");
        console.log(token);
      }}
    >
      Verify
    </button>
  );
}

export default withReCaptcha(VerifyButton);
```

---

## Notes

* **Client-only**: The script is loaded in the browser; safe to import in SSR apps.
* **No Window type augmentation**: avoids clashes with other ambient `Window.grecaptcha` typings.
* **CSP & China**: Supports `nonce` and `recaptcha.net` host.
* **Default action**: Provide via props or env; `executeRecaptcha()` can omit the `action`.

---

## Troubleshooting

* **Invalid hook call / multiple Reacts**: Ensure your app uses a single React instance.

  * Package is published with `react`/`react-dom` as **peerDependencies** (not bundled).
  * If you are linking locally, prefer `npm pack` + install the `.tgz` instead of `npm link`.
  * Optionally force a single React via bundler:

    * Webpack/Rspack:

      ```js
      resolve: { alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      }}
      ```
    * Vite: `resolve: { dedupe: ['react','react-dom'] }`
* **Props mutation errors** (e.g., “object is not extensible”): Never mutate incoming props; clone/derive new objects when needed.
* **Enterprise vs non-Enterprise**: This library only loads the Enterprise script. Make sure your site key is an **Enterprise** key.

---

## License

MIT
