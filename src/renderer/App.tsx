import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type {
    BinaryStatus,
    HistoryRow,
    ProgressUpdate,
    QueueState,
} from "../shared/types";
import { api } from "./api";
import { DownloadForm } from "./components/DownloadForm";
import { EncodeDeck } from "./components/EncodeDeck";
import { HistoryTable } from "./components/HistoryTable";
import { QueueList } from "./components/QueueList";

type ToastSeverity = "success" | "error" | "info" | "warning";

interface Toast {
    key: number;
    message: string;
    severity: ToastSeverity;
}

export function App() {
    const [queueState, setQueueState] = useState<QueueState>({
        queue: [],
        current: null,
    });
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const [progress, setProgress] = useState<ProgressUpdate | null>(null);
    const [binaries, setBinaries] = useState<BinaryStatus | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);

    const notify = useCallback((message: string, severity: ToastSeverity) => {
        setToast({ key: Date.now(), message, severity });
    }, []);

    const refreshHistory = useCallback(() => {
        api.getHistory().then(setHistory).catch(console.error);
    }, []);

    // One initial fetch, then everything arrives as pushed events —
    // no polling.
    useEffect(() => {
        api.getQueueState().then(setQueueState).catch(console.error);
        api.getBinaryStatus().then(setBinaries).catch(console.error);
        refreshHistory();

        const unsubQueue = api.onQueueUpdated((state) => {
            setQueueState(state);
            if (!state.current) {
                setProgress(null);
            }
        });
        const unsubProgress = api.onDownloadProgress(setProgress);
        const unsubFinished = api.onDownloadFinished((outcome) => {
            if (outcome.success) {
                notify(`Saved "${outcome.title}"`, "success");
            } else {
                notify(
                    outcome.error || `Download failed: ${outcome.url}`,
                    "error",
                );
            }
            refreshHistory();
        });

        return () => {
            unsubQueue();
            unsubProgress();
            unsubFinished();
        };
    }, [notify, refreshHistory]);

    const handleDelete = useCallback(
        (id: number) => {
            api.deleteHistory(id)
                .then(() => {
                    refreshHistory();
                    notify(
                        "Removed from history — it can be downloaded again.",
                        "info",
                    );
                })
                .catch(console.error);
        },
        [notify, refreshHistory],
    );

    const missing: string[] = [];
    if (binaries && !binaries.ytDlp) missing.push("yt-dlp");
    if (binaries && !binaries.ffmpeg) missing.push("ffmpeg");

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Stack spacing={2.5}>
                <Stack spacing={0.5} component="header">
                    <Typography
                        variant="overline"
                        sx={{ color: "primary.main", lineHeight: 1.6 }}
                    >
                        URL → TAGGED MP3
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                        SaggySonic
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Paste a link, get a tagged MP3 — cover art included.
                    </Typography>
                </Stack>

                {missing.length > 0 && (
                    <Alert severity="warning" variant="outlined">
                        Can&apos;t find {missing.join(" or ")}. Downloads
                        won&apos;t work until{" "}
                        {missing.length > 1 ? "they're" : "it's"} installed and
                        on your PATH.
                    </Alert>
                )}

                <DownloadForm notify={notify} />
                <EncodeDeck current={queueState.current} progress={progress} />
                <QueueList queue={queueState.queue} />
                <HistoryTable
                    history={history}
                    onOpen={(url) => {
                        void api.openExternal(url);
                    }}
                    onDelete={handleDelete}
                />
            </Stack>

            <Snackbar
                key={toast ? toast.key : undefined}
                open={toast !== null}
                autoHideDuration={4000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    variant="filled"
                    severity={toast ? toast.severity : "info"}
                    onClose={() => setToast(null)}
                    sx={{ width: "100%" }}
                >
                    {toast ? toast.message : ""}
                </Alert>
            </Snackbar>
        </Container>
    );
}
