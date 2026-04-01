import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from "./app";

// application root renders with theme provider and provides toggle function
const Main: React.FC = () => {
    return (
        <App />
    );
};

const root = createRoot(document.body);
root.render(<Main />);
