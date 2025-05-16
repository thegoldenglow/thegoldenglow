import { createContext, useContext, useEffect, useState } from 'react';

const TelegramContext = createContext(null);

export function TelegramProvider({ children }) {
  const [telegram, setTelegram] = useState(null);
  
  useEffect(() => {
    // Import the TWA SDK dynamically to avoid SSR issues
    const loadTelegramWebApp = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        
        // Initialize the WebApp
        if (WebApp?.initData) {
          WebApp.ready();
          WebApp.expand();
          setTelegram(WebApp);
        }
      } catch (error) {
        console.error('Failed to initialize Telegram Web App:', error);
      }
    };

    loadTelegramWebApp();
  }, []);

  return (
    <TelegramContext.Provider value={telegram}>
      {children}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);
