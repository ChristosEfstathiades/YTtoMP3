import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});
// application root renders with theme provider and provides toggle function
const Main: React.FC = () => {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline>
                <App />
            </CssBaseline>
        </ThemeProvider>
    );
};

const root = createRoot(document.body);
root.render(<Main />);
