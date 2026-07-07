import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useLocalStorage } from "@uidotdev/usehooks";
import { api } from "../api";
import { monoFontFamily } from "../theme";

const monoInput = { sx: { fontFamily: monoFontFamily, fontSize: 14 } };

interface DownloadFormProps {
    notify: (
        message: string,
        severity: "success" | "error" | "info" | "warning",
    ) => void;
}

export function DownloadForm({ notify }: DownloadFormProps) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [directory, setDirectory] = useLocalStorage<string>(
        "downloadDirectory",
        "",
    );

    // The focus listener is registered once, so it reads the current URL
    // through a ref instead of closing over a stale value.
    const urlRef = useRef(url);
    urlRef.current = url;

    // Auto-fill the link field from the clipboard when the window regains
    // focus, but never overwrite something the user already typed.
    useEffect(() => {
        const onFocus = () => {
            if (urlRef.current) return;
            api.getClipboard()
                .then((text) => {
                    const candidate = (text || "").trim();
                    if (/^https?:\/\//i.test(candidate) && !urlRef.current) {
                        setUrl(candidate);
                    }
                })
                .catch(() => undefined);
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    const pasteLink = async () => {
        const text = ((await api.getClipboard()) || "").trim();
        if (/^https?:\/\//i.test(text)) {
            setUrl(text);
        } else {
            notify("The clipboard doesn't contain a link.", "info");
        }
    };

    const chooseFolder = async () => {
        const selected = await api.selectDownloadDirectory();
        if (selected) {
            setDirectory(selected);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await api.addToQueue({
                url,
                title,
                artist,
                directory,
                startTime,
                endTime,
            });
            if (result.success) {
                setUrl("");
                setTitle("");
                setArtist("");
                setStartTime("");
                setEndTime("");
                notify(result.message, "success");
            } else {
                notify(result.message, "error");
            }
        } catch (err) {
            notify("Something went wrong adding that to the queue.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="Link"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=…"
                        fullWidth
                        autoFocus
                        slotProps={{
                            input: {
                                ...monoInput,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {url ? (
                                            <Tooltip title="Clear">
                                                <IconButton
                                                    size="small"
                                                    edge="end"
                                                    onClick={() => setUrl("")}
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Paste link">
                                                <IconButton
                                                    size="small"
                                                    edge="end"
                                                    onClick={() => {
                                                        void pasteLink();
                                                    }}
                                                >
                                                    <ContentPasteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Use the video title"
                            fullWidth
                        />
                        <TextField
                            label="Artist"
                            value={artist}
                            onChange={(event) => setArtist(event.target.value)}
                            placeholder="Use the uploader name"
                            fullWidth
                        />
                    </Stack>

                    <Stack spacing={0.75}>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Start at"
                                value={startTime}
                                onChange={(event) =>
                                    setStartTime(event.target.value)
                                }
                                placeholder="0:00"
                                fullWidth
                                slotProps={{ input: monoInput }}
                            />
                            <TextField
                                label="End at"
                                value={endTime}
                                onChange={(event) =>
                                    setEndTime(event.target.value)
                                }
                                placeholder="Full length"
                                fullWidth
                                slotProps={{ input: monoInput }}
                            />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Clip a section with HH:MM:SS, MM:SS, or plain
                            seconds. Leave both blank for the whole track.
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="outlined"
                            startIcon={<FolderOpenIcon />}
                            onClick={() => {
                                void chooseFolder();
                            }}
                            sx={{ flexShrink: 0 }}
                        >
                            {directory ? "Change folder" : "Choose folder"}
                        </Button>
                        <Typography
                            variant="body2"
                            title={directory || undefined}
                            sx={{
                                fontFamily: monoFontFamily,
                                fontSize: 12,
                                minWidth: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: directory
                                    ? "text.secondary"
                                    : "warning.main",
                            }}
                        >
                            {directory || "No folder selected yet"}
                        </Typography>
                    </Stack>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={submitting}
                    >
                        {submitting ? "Adding…" : "Add to queue"}
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
}
