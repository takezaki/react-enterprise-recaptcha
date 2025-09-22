var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  ReCaptcha: () => ReCaptcha,
  ReCaptchaProvider: () => ReCaptchaProvider,
  useReCaptcha: () => useReCaptcha,
  withReCaptcha: () => withReCaptcha
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);
var SCRIPT_ID = "__recaptcha_enterprise_script__";
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function getRecaptchaEnterprise() {
  const g = globalThis?.grecaptcha;
  return g?.enterprise;
}
function buildEnterpriseSrc(params) {
  const { siteKey, useRecaptchaNet, language } = params;
  const host = useRecaptchaNet ? "https://www.recaptcha.net" : "https://www.google.com";
  const qs = new URLSearchParams({ render: siteKey });
  if (language) qs.set("hl", language);
  return `${host}/recaptcha/enterprise.js?${qs.toString()}`;
}
function ensureScriptLoaded(opts) {
  const ent = getRecaptchaEnterprise();
  if (isBrowser() && ent?.execute) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("reCAPTCHA can only be loaded in a browser environment."));
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (existing._loaded) {
        resolve();
        return;
      }
      const onLoad = () => resolve();
      const onError = () => reject(new Error("Failed to load reCAPTCHA Enterprise script."));
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = buildEnterpriseSrc(opts);
    script.async = true;
    script.defer = true;
    if (opts.nonce) script.nonce = opts.nonce;
    script.addEventListener("load", () => {
      script._loaded = true;
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error("Failed to load reCAPTCHA Enterprise script."));
    });
    document.head.appendChild(script);
  });
}
function readEnv(name) {
  try {
    return process?.env?.[name];
  } catch {
    return void 0;
  }
}
var ReCaptchaContext = (0, import_react.createContext)(null);
function ReCaptchaProvider({
  children,
  reCaptchaKey,
  language,
  useRecaptchaNet,
  nonce,
  useEnterprise = true,
  defaultAction,
  reCaptchaAction
}) {
  const siteKey = (0, import_react.useMemo)(
    () => reCaptchaKey || (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY : void 0),
    [reCaptchaKey]
  );
  if (useEnterprise !== true && typeof console !== "undefined") {
    console.warn("[react-enterprise-recaptcha] Enterprise only. 'useEnterprise' is always treated as true.");
  }
  const computedDefaultAction = (0, import_react.useMemo)(() => {
    return defaultAction || reCaptchaAction || readEnv("NEXT_PUBLIC_RECAPTCHA_ACTION") || readEnv("RECAPTCHA_ACTION") || void 0;
  }, [defaultAction, reCaptchaAction]);
  const [isLoaded, setLoaded] = (0, import_react.useState)(false);
  const [isError, setIsError] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const loadingRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!siteKey) {
      setIsError(true);
      setError(
        new Error(
          "Missing reCAPTCHA site key. Pass 'reCaptchaKey' to <ReCaptchaProvider /> or set NEXT_PUBLIC_RECAPTCHA_SITE_KEY."
        )
      );
      return;
    }
    let cancelled = false;
    const p = ensureScriptLoaded({ siteKey, useRecaptchaNet, language, nonce }).then(() => {
      if (cancelled) return;
      getRecaptchaEnterprise()?.ready(() => {
        if (!cancelled) setLoaded(true);
      });
    }).catch((err) => {
      if (cancelled) return;
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    });
    loadingRef.current = p;
    return () => {
      cancelled = true;
    };
  }, [siteKey, language, useRecaptchaNet, nonce]);
  const executeRecaptcha = (0, import_react.useCallback)(
    async (action) => {
      if (!siteKey) throw new Error("Missing reCAPTCHA site key.");
      if (loadingRef.current) await loadingRef.current.catch(() => {
      });
      const api = getRecaptchaEnterprise();
      if (!api?.execute) throw new Error("reCAPTCHA Enterprise API not available.");
      const finalAction = action ?? computedDefaultAction;
      if (!finalAction) {
        throw new Error(
          "Missing reCAPTCHA action. Pass an action to executeRecaptcha(action) or configure defaultAction / RECAPTCHA_ACTION."
        );
      }
      return api.execute(siteKey, { action: finalAction });
    },
    [siteKey, computedDefaultAction]
  );
  const value = (0, import_react.useMemo)(
    () => ({
      reCaptchaKey: siteKey,
      grecaptcha: isBrowser() ? window.grecaptcha : void 0,
      isLoaded,
      isError,
      error,
      defaultAction: computedDefaultAction,
      executeRecaptcha
    }),
    [siteKey, isLoaded, isError, error, computedDefaultAction, executeRecaptcha]
  );
  return /* @__PURE__ */ import_react.default.createElement(ReCaptchaContext.Provider, { value }, children);
}
function useReCaptcha() {
  const ctx = (0, import_react.useContext)(ReCaptchaContext);
  if (!ctx) throw new Error("useReCaptcha must be used within <ReCaptchaProvider />");
  return ctx;
}
function ReCaptcha(props) {
  const { onValidate, action, refreshReCaptcha, onError } = props;
  const { isLoaded, executeRecaptcha } = useReCaptcha();
  (0, import_react.useEffect)(() => {
    let alive = true;
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await executeRecaptcha(action);
        if (alive) onValidate(token);
      } catch (err) {
        onError?.(err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isLoaded, executeRecaptcha, action, refreshReCaptcha]);
  return null;
}
function withReCaptcha(Component) {
  return function WithReCaptchaWrapper(props) {
    const { isLoaded, executeRecaptcha } = useReCaptcha();
    return /* @__PURE__ */ import_react.default.createElement(Component, { ...props, isLoaded, executeRecaptcha });
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ReCaptcha,
  ReCaptchaProvider,
  useReCaptcha,
  withReCaptcha
});
