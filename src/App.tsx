import { useEffect } from "react";
import { matchPath, useLocation, useRoutes } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { routes } from "./routes";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./index.css";
import "./tailwind.css";

import { Loader } from "./components/Loader";
import { Toaster } from "./components/ui/sonner";
import { ChatNudge } from './components/chat-nudge'; // Import ChatNudge

setupIonicReact();

function App() {
  const location = useLocation();
  const element = useRoutes(routes);

  const currentPath = location.pathname;

  useEffect(() => {
    // Google Analytics page view tracking
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_title: document.title,
        page_path: currentPath,
        page_location: window.location.href,
      });
    }
  }, [currentPath]);

  const isAuthRoute = matchPath("/auth/*", currentPath);

  if (!element) {
    return <Loader />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet id="main">
          {element}
        </IonRouterOutlet>
      </IonReactRouter>
      <Toaster richColors />
      {!isAuthRoute && <ChatNudge chatMessagesCount={0} />} {/* Conditionally render ChatNudge */}
    </IonApp>
  );
}

export default App;
