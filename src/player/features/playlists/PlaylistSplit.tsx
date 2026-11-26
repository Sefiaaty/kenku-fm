import React from "react";
import { useParams } from "react-router-dom";

import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Playlists } from "./Playlists";
import { Playlist } from "./Playlist";
import { Track } from "./playlistsSlice";

type PlaylistSplitProps = {
  onPlay: (track: Track) => void;
};

/**
 * On a wide window, keep the playlist grid on the left and open the chosen
 * playlist on the right. On a narrow window, show the playlist on its own.
 */
export function PlaylistSplit({ onPlay }: PlaylistSplitProps) {
  const { playlistId } = useParams();
  const wide = useMediaQuery("(min-width: 1000px)");

  if (!wide) {
    return <Playlist onPlay={onPlay} />;
  }

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
        <Playlists onPlay={onPlay} selectedId={playlistId} />
      </Box>
      <Box
        sx={{
          flex: "1 1 45%",
          minWidth: 380,
          position: "relative",
          overflow: "hidden",
          borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Playlist onPlay={onPlay} embedded />
      </Box>
    </Box>
  );
}
