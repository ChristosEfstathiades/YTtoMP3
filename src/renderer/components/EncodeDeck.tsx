import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatTimecode } from "../../shared/time";
import type {
    ActiveDownload,
    DownloadStage,
    ProgressUpdate,
} from "../../shared/types";
import { monoFontFamily } from "../theme";

const stageLabels: Record<DownloadStage, string> = {
    metadata: "FETCHING INFO",
    downloading: "ENCODING",
    tagging: "TAGGING",
};

interface EncodeDeckProps {
    current: ActiveDownload | null;
    progress: ProgressUpdate | null;
}

/** The active-download panel: stage light, track info, progress, timecode. */
export function EncodeDeck({ current, progress }: EncodeDeckProps) {
    if (!current) {
        return null;
    }

    const active = progress && progress.url === current.url ? progress : null;

    // Percent is only meaningful while ffmpeg runs and the total duration is
    // known; everything else shows an indeterminate bar (tagging is near
    // instant, so it just holds at full).
    let percent: number | null = null;
    if (current.stage === "downloading" && active) {
        percent = active.percent;
    } else if (current.stage === "tagging") {
        percent = 100;
    }

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2.5, borderColor: "rgba(255, 176, 46, 0.35)" }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            animation: "deckPulse 1.2s ease-in-out infinite",
                            "@keyframes deckPulse": {
                                "0%, 100%": { opacity: 1 },
                                "50%": { opacity: 0.3 },
                            },
                            "@media (prefers-reduced-motion: reduce)": {
                                animation: "none",
                            },
                        }}
                    />
                    <Typography
                        variant="overline"
                        sx={{ color: "primary.main", lineHeight: 1.4 }}
                    >
                        {stageLabels[current.stage]}
                    </Typography>
                </Stack>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        fontWeight={600}
                        noWrap
                        title={current.title || current.url}
                        sx={
                            current.title
                                ? undefined
                                : { fontFamily: monoFontFamily, fontSize: 14 }
                        }
                    >
                        {current.title || current.url}
                    </Typography>
                    {current.artist ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                        >
                            {current.artist}
                        </Typography>
                    ) : null}
                </Box>

                <LinearProgress
                    variant={percent === null ? "indeterminate" : "determinate"}
                    value={percent === null ? 0 : percent}
                    sx={{ height: 8, borderRadius: 4 }}
                />

                {current.stage === "downloading" && active ? (
                    <Typography
                        variant="caption"
                        sx={{
                            fontFamily: monoFontFamily,
                            color: "text.secondary",
                            alignSelf: "flex-end",
                        }}
                    >
                        {formatTimecode(active.elapsedSeconds)}
                        {active.totalSeconds !== null
                            ? ` / ${formatTimecode(active.totalSeconds)}`
                            : ""}
                    </Typography>
                ) : null}
            </Stack>
        </Paper>
    );
}
