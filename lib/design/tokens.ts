export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: Record<string, string>;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    base: string;
    scale: Record<string, string>;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: Record<string, string>;
}

const defaultNeutralPalette = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
  950: "#020617",
};

const defaultSpacingScale = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
};

function defaultDesignTokens(): DesignTokens {
  return {
    colors: {
      primary: process.env.NEXT_PUBLIC_DEFAULT_PRIMARY_COLOR || "#2B5E8C",
      secondary: process.env.NEXT_PUBLIC_DEFAULT_SECONDARY_COLOR || "#F4A261",
      accent: "#E76F51",
      neutral: defaultNeutralPalette,
    },
    fonts: {
      heading: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
      body: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
    },
    spacing: {
      base: "1rem",
      scale: defaultSpacingScale,
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
    shadows: {
      sm: "0 1px 2px rgb(15 23 42 / 0.08)",
      md: "0 12px 28px rgb(15 23 42 / 0.12)",
      lg: "0 24px 60px rgb(15 23 42 / 0.16)",
      xl: "0 32px 90px rgb(15 23 42 / 0.22)",
    },
  };
}

export function buildDesignTokens(preferences: Partial<DesignTokens> = {}): DesignTokens {
  const defaults = defaultDesignTokens();

  return {
    colors: {
      ...defaults.colors,
      ...preferences.colors,
      neutral: {
        ...defaults.colors.neutral,
        ...preferences.colors?.neutral,
      },
    },
    fonts: {
      ...defaults.fonts,
      ...preferences.fonts,
    },
    spacing: {
      ...defaults.spacing,
      ...preferences.spacing,
      scale: {
        ...defaults.spacing.scale,
        ...preferences.spacing?.scale,
      },
    },
    borderRadius: {
      ...defaults.borderRadius,
      ...preferences.borderRadius,
    },
    shadows: {
      ...defaults.shadows,
      ...preferences.shadows,
    },
  };
}
