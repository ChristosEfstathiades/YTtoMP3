import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";

export default function App() {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!url.trim()) {
            setStatus("Please enter a URL.");
            return;
        }

        setLoading(true);
        setStatus("Starting download...");

        try {
            const result = await (window as any).electron.downloadMp3(url);
            setStatus(result.message ?? "Download complete.");
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : "Download failed.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxWidth: 640,
                margin: "0 auto",
            }}
        >
            <Typography variant="h4">Download a URL to MP3</Typography>
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
                <TextField
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    label="URL"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                />
                <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? "Downloading…" : "Download MP3"}
                </Button>
            </Box>
            {status ? <Typography>{status}</Typography> : null}
        </Box>
    );
}
