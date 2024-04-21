/**
 * After getting the theme from https://ui.shadcn.com/themes in css format, paste them here and
 * using regex:
 * look for: `--(.+): (.+);`
 * replace with: `"$1": "$2", // hsl($2)`
 *
 * Then, remove the non-color variables (just radius at the moment).
 */

export const themes = {
  default: {
    light: {
      background: "0 0% 100%", // hsl(0 0% 100%)
      foreground: "0 0% 3.9%", // hsl(0 0% 3.9%)
      card: "0 0% 100%", // hsl(0 0% 100%)
      "card-foreground": "0 0% 3.9%", // hsl(0 0% 3.9%)
      popover: "0 0% 100%", // hsl(0 0% 100%)
      "popover-foreground": "0 0% 3.9%", // hsl(0 0% 3.9%)
      primary: "0 0% 9%", // hsl(0 0% 9%)
      "primary-foreground": "0 0% 98%", // hsl(0 0% 98%)
      secondary: "0 0% 96.1%", // hsl(0 0% 96.1%)
      "secondary-foreground": "0 0% 9%", // hsl(0 0% 9%)
      muted: "0 0% 96.1%", // hsl(0 0% 96.1%)
      "muted-foreground": "0 0% 45.1%", // hsl(0 0% 45.1%)
      accent: "0 0% 96.1%", // hsl(0 0% 96.1%)
      "accent-foreground": "0 0% 9%", // hsl(0 0% 9%)
      destructive: "0 84.2% 60.2%", // hsl(0 84.2% 60.2%)
      "destructive-foreground": "0 0% 98%", // hsl(0 0% 98%)
      border: "0 0% 89.8%", // hsl(0 0% 89.8%)
      input: "0 0% 89.8%", // hsl(0 0% 89.8%)
      ring: "0 0% 3.9%", // hsl(0 0% 3.9%)
    },

    dark: {
      background: "0 0% 3.9%", // hsl(0 0% 3.9%)
      foreground: "0 0% 98%", // hsl(0 0% 98%)
      card: "0 0% 3.9%", // hsl(0 0% 3.9%)
      "card-foreground": "0 0% 98%", // hsl(0 0% 98%)
      popover: "0 0% 3.9%", // hsl(0 0% 3.9%)
      "popover-foreground": "0 0% 98%", // hsl(0 0% 98%)
      primary: "0 0% 98%", // hsl(0 0% 98%)
      "primary-foreground": "0 0% 9%", // hsl(0 0% 9%)
      secondary: "0 0% 14.9%", // hsl(0 0% 14.9%)
      "secondary-foreground": "0 0% 98%", // hsl(0 0% 98%)
      muted: "0 0% 14.9%", // hsl(0 0% 14.9%)
      "muted-foreground": "0 0% 63.9%", // hsl(0 0% 63.9%)
      accent: "0 0% 14.9%", // hsl(0 0% 14.9%)
      "accent-foreground": "0 0% 98%", // hsl(0 0% 98%)
      destructive: "0 62.8% 30.6%", // hsl(0 62.8% 30.6%)
      "destructive-foreground": "0 0% 98%", // hsl(0 0% 98%)
      border: "0 0% 14.9%", // hsl(0 0% 14.9%)
      input: "0 0% 14.9%", // hsl(0 0% 14.9%)
      ring: "0 0% 83.1%", // hsl(0 0% 83.1%)
    },
  },
}
