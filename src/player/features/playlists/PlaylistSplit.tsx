import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Playlists } from "./Playlists";
import { Playlist } from "./Playlist";
import { Track } from "./playlistsSlice";
import { RootState } from "../../app/store";

type PlaylistSplitProps = {
  onPlay: (track: Track) => void;
};

/**
 * On a wide window, keep the playlist grid on the left and a playlist open on
 * the right: the one you clicked, or else the one that is playing.
 * On a narrow window, show the grid or the playlist on its own, as before.
 */
export function PlaylistSplit({ onPlay }: PlaylistSplitProps) {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const wide = useMediaQuery("(min-width: 700px)");
  const playlists = useSelector((state: RootState) => state.playlists);
  const playingId = useSelector(
    (state: RootState) => state.playlistPlayback.queue?.playlistId
  );

  if (!wide) {
    return playlistId ? (
      <Playlist onPlay={onPlay} />
    ) : (
      <Playlists onPlay={onPlay} />
    );
  }

  const openId =
    playlistId ??
    (playingId && playlists.playlists.byId[playingId] ? playingId : undefined);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box
        sx={{
          flex: "1 1 55%",
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Playlists onPlay={onPlay} selectedId={openId} embedded />
      </Box>
      <Box
        sx={{
          flex: "1 1 45%",
          minWidth: 320,
          position: "relative",
          overflow: "hidden",
          borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {openId ? (
          <Playlist
            onPlay={onPlay}
            embedded
            id={openId}
            onClose={
              playlistId
                ? () => navigate("/playlists", { replace: true })
                : undefined
            }
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%", px: 4, textAlign: "center" }}
          >
            <Typography variant="h6" color="text.secondary">
              Click a playlist to open it here
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
