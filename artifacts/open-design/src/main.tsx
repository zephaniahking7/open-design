import { createRoot } from "react-dom/client";
import { I18nProvider } from "./i18n";
import { App } from "./App";
import "./index.css";

const themeInitScript = `(function(){try{var t=JSON.parse(localStorage.getItem('open-design:config')||'{}').theme;if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
const s = document.createElement('script');
s.textContent = themeInitScript;
document.head.appendChild(s);

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
