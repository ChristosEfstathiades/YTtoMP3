import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { HistoryRow } from "../../shared/types";

interface HistoryTableProps {
    history: HistoryRow[];
    onOpen: (url: string) => void;
    onDelete: (id: number) => void;
}

// created_at is UTC "YYYY-MM-DD HH:MM:SS" from SQLite's datetime('now');
// rows from before the column existed are null.
function formatAdded(createdAt: string | null): string {
    if (!createdAt) {
        return "—";
    }
    const date = new Date(createdAt.replace(" ", "T") + "Z");
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function HistoryTable({ history, onOpen, onDelete }: HistoryTableProps) {
    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
                DOWNLOADED — {history.length}
            </Typography>

            {history.length === 0 ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                >
                    Nothing downloaded yet — finished tracks land here.
                </Typography>
            ) : (
                <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Track</TableCell>
                            <TableCell>Added</TableCell>
                            <TableCell align="right" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell sx={{ maxWidth: 0, width: "100%" }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        noWrap
                                        title={row.title}
                                    >
                                        {row.title}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                        display="block"
                                    >
                                        {row.artist}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    sx={{
                                        whiteSpace: "nowrap",
                                        color: "text.secondary",
                                    }}
                                >
                                    {formatAdded(row.created_at)}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    <Tooltip title="Open the original link">
                                        <IconButton
                                            size="small"
                                            onClick={() => onOpen(row.url)}
                                        >
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove from history">
                                        <IconButton
                                            size="small"
                                            onClick={() => onDelete(row.id)}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
}
