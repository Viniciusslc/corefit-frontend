declare module "*.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            callback: (response: { code?: string }) => void;
            error_callback?: (error?: { type?: string }) => void;
          }): {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

export {};
