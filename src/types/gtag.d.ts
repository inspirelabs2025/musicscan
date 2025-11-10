declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        page_path?: string;
        page_title?: string;
        send_page_view?: boolean;
        [key: string]: any;
      }
    ) => void;
    dataLayer?: any[];
  }
}

export {};
