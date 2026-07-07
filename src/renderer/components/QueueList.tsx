import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { QueueItem } from "../../shared/types";
import { api } from "../api";
import { monoFontFamily } from "../theme";

interface QueueListProps {
    queue: QueueItem[];
}

export function QueueList({ queue }: QueueListProps) {
    if (queue.length === 0) {
        return null;
    }

    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
                UP NEXT — {queue.length}
            </Typography>
            <Stack divider={<Divider />} sx={{ mt: 1 }}>
                {queue.map((item) => (
                    <Stack
                        key={item.url}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ py: 0.75 }}
                    >
                        <Typography
                            variant="body2"
                            noWrap
                            title={item.url}
                            sx={{
                                flexGrow: 1,
                                minWidth: 0,
                                fontFamily: item.title
                                    ? undefined
                                    : monoFontFamily,
                                fontSize: item.title ? undefined : 13,
                            }}
                        >
                            {item.title || item.url}
                        </Typography>
                        <Tooltip title="Remove from queue">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    // The queue-updated event refreshes the UI.
                                    void api.removeFromQueue(item.url);
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}
