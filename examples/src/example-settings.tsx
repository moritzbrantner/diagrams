import * as React from "react";

const SETTINGS_BROWSER_BUNDLE_URL =
  "https://cdn.jsdelivr.net/gh/moritzbrantner/settings@5e6b7383b14f1549154d2100f5df3d39d42d66ab/settings-browser.js";
const SHARED_SETTINGS_STORAGE_KEY = "diagrams.examples.settings.user.v2";
const LEGACY_SETTINGS_STORAGE_KEY = "diagrams.examples.settings.v1";
const SHOW_API_SHAPE_SETTING_ID = "examples.show_api_shape";

type WireSettingValue =
  | { type: "bool"; value: boolean }
  | { type: "integer"; value: number }
  | { type: "number"; value: number }
  | { type: "text"; value: string }
  | { type: "choice"; value: string };

type WireSettingDefinition = {
  id: string;
  kind: { type: "bool" };
  default: WireSettingValue;
  scope: "user";
  apply_mode: "immediate";
};

type WirePresentationEntry = {
  id: string;
  metadata: {
    label_key: string;
    description_key?: string;
    category_key: string;
    order: number;
    discoverability: "primary";
  };
};

type SettingsFoundationSession = {
  effectiveValues(): Record<string, WireSettingValue>;
  set(id: string, value: WireSettingValue): void;
  importScope(scope: "user", snapshot: string): unknown[];
  exportScope(scope: "user"): string;
  dispose(): void;
};

type SettingsBrowserModule = {
  createSettingsSession(
    definitions: readonly WireSettingDefinition[],
    presentation?: readonly WirePresentationEntry[],
  ): Promise<SettingsFoundationSession>;
};

type FoundationStatus = "loading" | "ready" | "degraded";

type ExampleSettingsContextValue = {
  foundationStatus: FoundationStatus;
  showApiShape: boolean;
  setShowApiShape(value: boolean): void;
};

const ExampleSettingsContext = React.createContext<ExampleSettingsContextValue | null>(null);

const settingDefinitions: readonly WireSettingDefinition[] = [
  {
    id: SHOW_API_SHAPE_SETTING_ID,
    kind: { type: "bool" },
    default: { type: "bool", value: true },
    scope: "user",
    apply_mode: "immediate",
  },
];

const presentation: readonly WirePresentationEntry[] = [
  {
    id: SHOW_API_SHAPE_SETTING_ID,
    metadata: {
      label_key: "examples.settings.showApiShape.label",
      description_key: "examples.settings.showApiShape.description",
      category_key: "examples.settings.presentation",
      order: 10,
      discoverability: "primary",
    },
  },
];

let browserModulePromise: Promise<SettingsBrowserModule> | undefined;

export function ExampleSettingsProvider({ children }: { children: React.ReactNode }) {
  const [showApiShape, setShowApiShape] = React.useState(readLegacyShowApiShape);
  const [foundationStatus, setFoundationStatus] = React.useState<FoundationStatus>("loading");
  const showApiShapeRef = React.useRef(showApiShape);
  const sessionRef = React.useRef<SettingsFoundationSession | null>(null);

  React.useEffect(() => {
    showApiShapeRef.current = showApiShape;
    writeLegacyShowApiShape(showApiShape);

    const session = sessionRef.current;
    if (!session) {
      return;
    }

    session.set(SHOW_API_SHAPE_SETTING_ID, { type: "bool", value: showApiShape });
    window.localStorage.setItem(SHARED_SETTINGS_STORAGE_KEY, session.exportScope("user"));
  }, [showApiShape]);

  React.useEffect(() => {
    let cancelled = false;

    void loadSettingsBrowserModule()
      .then(async (browserModule) => {
        const session = await browserModule.createSettingsSession(settingDefinitions, presentation);
        if (cancelled) {
          session.dispose();
          return;
        }

        const stored = window.localStorage.getItem(SHARED_SETTINGS_STORAGE_KEY);
        if (stored) {
          try {
            session.importScope("user", stored);
          } catch (error) {
            console.warn("Ignoring unreadable shared example settings", error);
            session.set(SHOW_API_SHAPE_SETTING_ID, {
              type: "bool",
              value: showApiShapeRef.current,
            });
          }
        } else {
          session.set(SHOW_API_SHAPE_SETTING_ID, {
            type: "bool",
            value: showApiShapeRef.current,
          });
        }

        const effective = session.effectiveValues()[SHOW_API_SHAPE_SETTING_ID];
        const restored = effective?.type === "bool" ? effective.value : showApiShapeRef.current;
        sessionRef.current = session;
        setShowApiShape(restored);
        window.localStorage.setItem(SHARED_SETTINGS_STORAGE_KEY, session.exportScope("user"));
        setFoundationStatus("ready");
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn(
            "Shared settings foundation unavailable; keeping the local examples preference projection.",
            error,
          );
          setFoundationStatus("degraded");
        }
      });

    return () => {
      cancelled = true;
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, []);

  const value = React.useMemo<ExampleSettingsContextValue>(
    () => ({ foundationStatus, showApiShape, setShowApiShape }),
    [foundationStatus, showApiShape],
  );

  return <ExampleSettingsContext.Provider value={value}>{children}</ExampleSettingsContext.Provider>;
}

export function useExampleSettings() {
  const value = React.useContext(ExampleSettingsContext);
  if (!value) {
    throw new Error("useExampleSettings must be used inside ExampleSettingsProvider");
  }
  return value;
}

async function loadSettingsBrowserModule(): Promise<SettingsBrowserModule> {
  browserModulePromise ??= import(
    /* @vite-ignore */ SETTINGS_BROWSER_BUNDLE_URL
  ) as Promise<SettingsBrowserModule>;
  return browserModulePromise;
}

function readLegacyShowApiShape() {
  try {
    const raw = window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { showApiShape?: unknown };
    return typeof parsed.showApiShape === "boolean" ? parsed.showApiShape : true;
  } catch {
    return true;
  }
}

function writeLegacyShowApiShape(showApiShape: boolean) {
  window.localStorage.setItem(LEGACY_SETTINGS_STORAGE_KEY, JSON.stringify({ showApiShape }));
}
