import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import { useLocalStorage } from "@uidotdev/usehooks";
import { FormEvent, useState, useEffect } from "react";

export default function App() {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloadDirectory, setDownloadDirectory] = useLocalStorage<string>(
        "downloadDirectory",
        "",
    );
    const [history, setHistory] = useState<
        Array<{ id: number; title: string; artist: string; url: string }>
    >([]);
    const [queue, setQueue] = useState<
        Array<{
            url: string;
            title?: string;
            artist?: string;
            directory: string;
        }>
    >([]);
    const [currentDownloading, setCurrentDownloading] = useState<{
        url: string;
        title?: string;
        artist?: string;
    } | null>(null);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [currentProgress, setCurrentProgress] = useState(0);

    useEffect(() => {
        fetchHistory();

        const handleFocus = async () => {
            try {
                const clipboardText = await (
                    window as any
                ).electron.getClipboard();
                if (clipboardText && clipboardText.startsWith("http") && !url) {
                    setUrl(clipboardText);
                }
            } catch (error) {
                // Ignore clipboard errors
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [url]);

    useEffect(() => {
        const fetchData = async () => {
            fetchHistory();
            fetchQueue();
            fetchCurrentDownloading();
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    // Listen for progress updates
    useEffect(() => {
        const unsubscribe = (window as any).electron?.onDownloadProgress?.(
            (progress: number) => {
                setCurrentProgress(progress);
            },
        );
        return () => unsubscribe?.();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await (window as any).electron.getHistory();
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    const fetchQueue = async () => {
        try {
            const data = await (window as any).electron.getQueue();
            setQueue(data);
        } catch (error) {
            console.error("Failed to fetch queue:", error);
        }
    };

    const fetchCurrentDownloading = async () => {
        try {
            const data = await (window as any).electron.getCurrentDownloading();
            setCurrentDownloading(data);
        } catch (error) {
            console.error("Failed to fetch current downloading:", error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await (window as any).electron.deleteHistory(id);
            fetchHistory();
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const handleSelectDirectory = async () => {
        try {
            const selected = await (
                window as any
            ).electron.selectDownloadDirectory();
            if (selected) {
                setDownloadDirectory(selected);
                setStatus(`Download directory saved: ${selected}`);
            }
        } catch (error) {
            console.error("Directory selection failed:", error);
            setStatus("Failed to select download directory.");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!downloadDirectory) {
            setStatus("Please select a download directory before continuing.");
            return;
        }

        if (!url.trim()) {
            setStatus("Please enter a URL.");
            return;
        }

        setLoading(true);
        setStatus("Adding to queue...");

        try {
            const result = await (window as any).electron.addToQueue({
                url,
                title: title.trim() || undefined,
                artist: artist.trim() || undefined,
                directory: downloadDirectory,
                startTime: startTime.trim() || undefined,
                endTime: endTime.trim() || undefined,
            });
            if (result.success) {
                setStatus(result.message ?? "Added to queue.");
                setUrl("");
                setTitle("");
                setArtist("");
                setStartTime("");
                setEndTime("");
                setCurrentProgress(0);
            } else {
                setStatus(result.message);
            }
        } catch (error) {
            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to add to queue.",
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
                <Button
                    variant="outlined"
                    onClick={handleSelectDirectory}
                    disabled={loading}
                >
                    {downloadDirectory
                        ? "Change download directory"
                        : "Select download directory"}
                </Button>
                {downloadDirectory ? (
                    <Typography sx={{ wordBreak: "break-all" }}>
                        Download folder: {downloadDirectory}
                    </Typography>
                ) : null}
                <TextField
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    label="URL"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                />
                <TextField
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    label="Title (optional)"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                />
                <TextField
                    value={artist}
                    onChange={(event) => setArtist(event.target.value)}
                    label="Artist (optional)"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                />
                <TextField
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    label="Start Time (optional, HH:MM:SS or seconds)"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                    placeholder="0:00"
                />
                <TextField
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    label="End Time (optional, HH:MM:SS or seconds)"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                    placeholder="End of video"
                />
                <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? "Downloading…" : "Download MP3"}
                </Button>
            </Box>
            {status ? <Typography>{status}</Typography> : null}
            {(currentDownloading || queue.length > 0) && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5">Download Queue</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Artist</TableCell>
                                    <TableCell>URL</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentDownloading && (
                                    <TableRow key="current">
                                        <TableCell>
                                            {currentDownloading.title ||
                                                "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {currentDownloading.artist ||
                                                "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {currentDownloading.url}
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={currentProgress}
                                                    sx={{ flex: 1 }}
                                                />
                                                <Typography variant="body2">
                                                    {currentProgress}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {queue.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {row.title || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {row.artist || "Unknown"}
                                        </TableCell>
                                        <TableCell>{row.url}</TableCell>
                                        <TableCell>Queued</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {history.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5">Download History</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Artist</TableCell>
                                    <TableCell>URL</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.title}</TableCell>
                                        <TableCell>{row.artist}</TableCell>
                                        <TableCell>{row.url}</TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={() =>
                                                    handleDelete(row.id)
                                                }
                                                color="error"
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
}
