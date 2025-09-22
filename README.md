# react-enterprise-recaptcha

A lightweight **reCAPTCHA Enterprise** wrapper for React with a **next-recaptcha-v3–compatible** API.
Framework-agnostic (no Next.js dependency) and client-only.

- `ReCaptchaProvider` – loads the Enterprise script and provides context
- `useReCaptcha()` – returns `{ executeRecaptcha(action?), isLoaded, isError, error, defaultAction, ... }`
- `<ReCaptcha />` – auto-executes on mount and calls `onValidate(token)`
- `withReCaptcha()` – HOC that injects `{ isLoaded, executeRecaptcha }`
- **Default action support**: can be provided via props or environment variables
  (`NEXT_PUBLIC_RECAPTCHA_ACTION` / `RECAPTCHA_ACTION`)

> This package is **Enterprise-only** (uses `https://www.google.com/recaptcha/enterprise.js`).

---

## Install

```bash
npm i react-enterprise-recaptcha
# or
yarn add react-enterprise-recaptcha
# or
pnpm add react-enterprise-recaptcha
