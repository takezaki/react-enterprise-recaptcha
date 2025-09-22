import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";

type GrecaptchaEnterprise = {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, opts: { action?: string }) => Promise<string>;
};

export type ReCaptchaProviderProps = PropsWithChildren<{
  reCaptchaKey?: string;
  useRecaptchaNet?: boolean;
  language?: string;
  nonce?: string;
  useEnterprise?: boolean;
  defaultAction?: string;
  reCaptchaAction?: string;
}>;

export type ReCaptchaContextValue = {
  reCaptchaKey?: string;
  grecaptcha?: any;
  isLoaded: boolean;
  isError: boolean;
  error: Error | null;
  defaultAction?: string;
  executeRecaptcha: (action?: string) => Promise<string>;
};

const SCRIPT_ID = "__recaptcha_enterprise_script__";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getRecaptchaEnterprise(): GrecaptchaEnterprise | undefined {
  const g: any = (globalThis as any)?.grecaptcha;
  return g?.enterprise as GrecaptchaEnterprise | undefined;
}

function buildEnterpriseSrc(params: {
  siteKey: string;
  useRecaptchaNet?: boolean;
  language?: string;
}): string {
  const { siteKey, useRecaptchaNet, language } = params;
  const host = useRecaptchaNet ? "https://www.recaptcha.net" : "https://www.google.com";
  const qs = new URLSearchParams({ render: siteKey });
  if (language) qs.set("hl", language);
  return `${host}/recaptcha/enterprise.js?${qs.toString()}`;
}

function ensureScriptLoaded(opts: {
  siteKey: string;
  useRecaptchaNet?: boolean;
  language?: string;
  nonce?: string;
}): Promise<void> {
  const ent = getRecaptchaEnterprise();
  if (isBrowser() && ent?.execute) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("reCAPTCHA can only be loaded in a browser environment."));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) {
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
      (script as any)._loaded = true;
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error("Failed to load reCAPTCHA Enterprise script."));
    });

    document.head.appendChild(script);
  });
}

function readEnv(name: string): string | undefined {
  try {
    return (process as any)?.env?.[name];
  } catch {
    return undefined;
  }
}

const ReCaptchaContext = createContext<ReCaptchaContextValue | null>(null);

export function ReCaptchaProvider({
  children,
  reCaptchaKey,
  language,
  useRecaptchaNet,
  nonce,
  useEnterprise = true,
  defaultAction,
  reCaptchaAction,
}: ReCaptchaProviderProps) {
  const siteKey = useMemo(
    () =>
      reCaptchaKey ||
      (typeof process !== "undefined" ? (process as any).env?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY : undefined),
    [reCaptchaKey]
  );

  if (useEnterprise !== true && typeof console !== "undefined") {
    console.warn("[react-enterprise-recaptcha] Enterprise only. 'useEnterprise' is always treated as true.");
  }

  const computedDefaultAction = useMemo(() => {
    return (
      defaultAction ||
      reCaptchaAction ||
      readEnv("NEXT_PUBLIC_RECAPTCHA_ACTION") ||
      readEnv("RECAPTCHA_ACTION") ||
      undefined
    );
  }, [defaultAction, reCaptchaAction]);

  const [isLoaded, setLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
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
    const p = ensureScriptLoaded({ siteKey, useRecaptchaNet, language, nonce })
      .then(() => {
        if (cancelled) return;
        getRecaptchaEnterprise()?.ready(() => {
          if (!cancelled) setLoaded(true);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    loadingRef.current = p;

    return () => {
      cancelled = true;
    };
  }, [siteKey, language, useRecaptchaNet, nonce]);

  const executeRecaptcha = useCallback<ReCaptchaContextValue["executeRecaptcha"]>(
    async (action?: string) => {
      if (!siteKey) throw new Error("Missing reCAPTCHA site key.");
      if (loadingRef.current) await loadingRef.current.catch(() => {});
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

  const value = useMemo<ReCaptchaContextValue>(
    () => ({
      reCaptchaKey: siteKey,
      grecaptcha: isBrowser() ? (window as any).grecaptcha : undefined,
      isLoaded,
      isError,
      error,
      defaultAction: computedDefaultAction,
      executeRecaptcha,
    }),
    [siteKey, isLoaded, isError, error, computedDefaultAction, executeRecaptcha]
  );

  return <ReCaptchaContext.Provider value={value}>{children}</ReCaptchaContext.Provider>;
}

export function useReCaptcha(): ReCaptchaContextValue {
  const ctx = useContext(ReCaptchaContext);
  if (!ctx) throw new Error("useReCaptcha must be used within <ReCaptchaProvider />");
  return ctx;
}

export type ReCaptchaProps = {
  onValidate: (token: string) => void;
  action?: string;
  refreshReCaptcha?: any;
  onError?: (err: unknown) => void;
};

export function ReCaptcha(props: ReCaptchaProps) {
  const { onValidate, action, refreshReCaptcha, onError } = props;
  const { isLoaded, executeRecaptcha } = useReCaptcha();

  useEffect(() => {
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

export type WithReCaptchaProps = {
  isLoaded: boolean;
  executeRecaptcha: (action?: string) => Promise<string>;
};

export function withReCaptcha<P extends object>(Component: React.ComponentType<P & WithReCaptchaProps>) {
  return function WithReCaptchaWrapper(props: P) {
    const { isLoaded, executeRecaptcha } = useReCaptcha();
    return <Component {...props} isLoaded={isLoaded} executeRecaptcha={executeRecaptcha} />;
  };
}
