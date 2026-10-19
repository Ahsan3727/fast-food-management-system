/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_RESTAURANT_LAT?: string;
  readonly VITE_RESTAURANT_LNG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
