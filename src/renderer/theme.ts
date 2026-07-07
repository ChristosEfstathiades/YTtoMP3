import { createTheme } from "@mui/material/styles";

/** Used for timecodes, URLs, and stage labels — anything "machine". */
export const monoFontFamily =
    '"Cascadia Mono", Consolas, "SF Mono", "Roboto Mono", monospace';

export const theme = createTheme({
    palette: {
        mode: "dark",
        background: { default: "#181310", paper: "#221b15" },
        primary: { main: "#ffb02e", contrastText: "#241a09" },
        success: { main: "#8fce91" },
        error: { main: "#f2765f" },
        warning: { main: "#ffcd70" },
        divider: "rgba(242, 231, 215, 0.1)",
        text: { primary: "#f2ebe1", secondary: "#a99e8f" },
    },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily:
            '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif',
        button: { textTransform: "none", fontWeight: 600 },
        overline: {
            fontFamily: monoFontFamily,
            letterSpacing: "0.16em",
            fontWeight: 600,
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: "none" } },
        },
        MuiTextField: {
            defaultProps: { size: "small" },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
        },
        MuiTooltip: {
            defaultProps: { arrow: true },
        },
    },
});
