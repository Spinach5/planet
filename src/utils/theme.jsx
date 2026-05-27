import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Taro from "@tarojs/taro";

const STORAGE_KEY = "settings_dark_mode";

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

function getStoredDarkMode() {
  try {
    const val = Taro.getStorageSync(STORAGE_KEY);
    return !!val;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = getStoredDarkMode();
    console.log("[ThemeProvider] init darkMode from storage:", stored);
    return stored;
  });

  const toggleDarkMode = useCallback((value) => {
    console.log("[ThemeProvider] toggleDarkMode called, value:", value, "type:", typeof value);
    try {
      setDarkMode(value);
      Taro.setStorageSync(STORAGE_KEY, value);
      console.log("[ThemeProvider] storage saved, darkMode set to:", value);
      if (process.env.TARO_ENV === "h5") {
        document.body.setAttribute("data-theme", value ? "dark" : "light");
        console.log("[ThemeProvider] H5 body data-theme set to:", value ? "dark" : "light");
      }
      if (process.env.TARO_ENV === "weapp") {
        Taro.setNavigationBarColor({
          frontColor: value ? "#ffffff" : "#000000",
          backgroundColor: value ? "#1a1a2e" : "#ffffff",
        });
        Taro.setBackgroundColor({
          backgroundColor: value ? "#1a1a2e" : "#ffffff",
        });
        console.log("[ThemeProvider] WeApp nav/background updated");
      }
    } catch (e) {
      console.error("[ThemeProvider] toggleDarkMode error:", e);
    }
  }, []);

  useEffect(() => {
    console.log("[ThemeProvider] mount, darkMode:", darkMode);
    if (darkMode) {
      console.log("[ThemeProvider] applying dark mode on mount");
      toggleDarkMode(true);
    }
  }, []);

  useEffect(() => {
    console.log("[ThemeProvider] darkMode state changed to:", darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function isForceUpdate() {
  try {
    return !!Taro.getStorageSync("settings_force_update");
  } catch {
    return false;
  }
}
