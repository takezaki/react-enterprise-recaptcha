import React, { PropsWithChildren } from 'react';

type ReCaptchaProviderProps = PropsWithChildren<{
    reCaptchaKey?: string;
    useRecaptchaNet?: boolean;
    language?: string;
    nonce?: string;
    useEnterprise?: boolean;
    defaultAction?: string;
    reCaptchaAction?: string;
}>;
type ReCaptchaContextValue = {
    reCaptchaKey?: string;
    grecaptcha?: any;
    isLoaded: boolean;
    isError: boolean;
    error: Error | null;
    defaultAction?: string;
    executeRecaptcha: (action?: string) => Promise<string>;
};
declare function ReCaptchaProvider({ children, reCaptchaKey, language, useRecaptchaNet, nonce, useEnterprise, defaultAction, reCaptchaAction, }: ReCaptchaProviderProps): React.JSX.Element;
declare function useReCaptcha(): ReCaptchaContextValue;
type ReCaptchaProps = {
    onValidate: (token: string) => void;
    action?: string;
    refreshReCaptcha?: any;
    onError?: (err: unknown) => void;
};
declare function ReCaptcha(props: ReCaptchaProps): null;
type WithReCaptchaProps = {
    isLoaded: boolean;
    executeRecaptcha: (action?: string) => Promise<string>;
};
declare function withReCaptcha<P extends object>(Component: React.ComponentType<P & WithReCaptchaProps>): (props: P) => React.JSX.Element;

export { ReCaptcha, type ReCaptchaContextValue, type ReCaptchaProps, ReCaptchaProvider, type ReCaptchaProviderProps, type WithReCaptchaProps, useReCaptcha, withReCaptcha };
