import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeProvider from "@mui/material/styles/ThemeProvider";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import LinearProgress from "@mui/material/LinearProgress";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import Close from "@mui/icons-material/Close";
import GraphicEq from "@mui/icons-material/GraphicEq";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PushPin from "@mui/icons-material/PushPin";
import PushPinOutlined from "@mui/icons-material/PushPinOutlined";
import Search from "@mui/icons-material/Search";
import SkipNext from "@mui/icons-material/SkipNext";
import SkipPrevious from "@mui/icons-material/SkipPrevious";
import Star from "@mui/icons-material/Star";
import StarBorder from "@mui/icons-material/StarBorder";
import VolumeOff from "@mui/icons-material/VolumeOff";
import VolumeUp from "@mui/icons-material/VolumeUp";

import { theme } from "../renderer/app/theme";
import { PlaylistPlaybackReply, PlaylistsReply } from "../types/player";

import "./index.css";

type Playlist = PlaylistsReply["playlists"][number];

const FAVORITES_KEY = "kenku-mini-favorites";

function loadFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Favorites just won't be remembered
  }
}

const PLAY = "PLAYER_REMOTE_PLAYLIST_PLAY";
const RESUME = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PLAY";
const PAUSE = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PAUSE";
const NEXT = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_NEXT";
const PREVIOUS = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PREVIOUS";
const VOLUME = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_VOLUME";
const MUTE = "PLAYER_REMOTE_PLAYLIST_PLAYBACK_MUTE";

function MiniPlayer() {
  const [playback, setPlayback] = useState<PlaylistPlaybackReply | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [connected, setConnected] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [onTop, setOnTop] = useState(true);
  const [query, setQuery] = useState("");
  const [dragVolume, setDragVolume] = useState<number | null>(null);

  const refreshPlayback = useCallback(async () => {
    const value = await window.mini.getPlayback();
    setConnected(value !== null);
    if (value) {
      setPlayback(value);
    }
  }, []);

  const refreshPlaylists = useCallback(async () => {
    const value = await window.mini.getPlaylists();
    if (value) {
      setPlaylists(value.playlists);
    }
  }, []);

  useEffect(() => {
    window.mini.getOnTop().then(setOnTop);
    refreshPlayback();
    refreshPlaylists();
    const playbackTimer = setInterval(refreshPlayback, 500);
    const playlistTimer = setInterval(refreshPlaylists, 4000);
    window.addEventListener("focus", refreshPlaylists);
    return () => {
      clearInterval(playbackTimer);
      clearInterval(playlistTimer);
      window.removeEventListener("focus", refreshPlaylists);
    };
  }, [refreshPlayback, refreshPlaylists]);

  function send(channel: string, ...args: unknown[]) {
    window.mini.command(channel, ...args);
    // Show the change quickly instead of waiting for the next poll
    setTimeout(refreshPlayback, 150);
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    saveFavorites(next);
  }

  function toggleOnTop() {
    window.mini.setOnTop(!onTop);
    setOnTop(!onTop);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? playlists.filter((p) => p.title.toLowerCase().includes(q))
      : playlists;
    // Favorites first, the rest in the order they have in Kenku
    const fav = list.filter((p) => favorites.includes(p.id));
    const rest = list.filter((p) => !favorites.includes(p.id));
    return [...fav, ...rest];
  }, [playlists, favorites, query]);

  const current = playback?.playlist
    ? playlists.find((p) => p.id === playback.playlist?.id)
    : undefined;
  const playing = Boolean(playback?.playing);
  const track = playback?.track;
  const volume = dragVolume ?? playback?.volume ?? 1;
  const muted = Boolean(playback?.muted);

  function handleTile(playlist: Playlist) {
    if (playback?.playlist?.id === playlist.id && track) {
      send(playing ? PAUSE : RESUME);
    } else {
      send(PLAY, playlist.id);
    }
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Title bar: drag the window from here */}
      <Stack
        className="drag"
        direction="row"
        alignItems="center"
        sx={{ height: 34, px: 1, flexShrink: 0 }}
      >
        <Typography
          variant="caption"
          sx={{ flex: 1, opacity: 0.6, fontWeight: 600, pl: 0.5 }}
        >
          Kenku FM
        </Typography>
        <Tooltip title={onTop ? "Stays on top (click to unpin)" : "Keep on top"}>
          <IconButton className="nodrag" size="small" onClick={toggleOnTop}>
            {onTop ? (
              <PushPin fontSize="small" color="primary" />
            ) : (
              <PushPinOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <IconButton
          className="nodrag"
          size="small"
          onClick={() => window.mini.close()}
        >
          <Close fontSize="small" />
        </IconButton>
      </Stack>

      {/* Now playing */}
      <Box
        className="drag"
        sx={{
          position: "relative",
          flexShrink: 0,
          mx: 1,
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        {current?.image && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("${current.image}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.35,
            }}
          />
        )}
        <Box sx={{ position: "relative", px: 1.5, pt: 1.25, pb: 0.5 }}>
          <Typography variant="caption" noWrap component="div" sx={{ opacity: 0.75 }}>
            {!connected
              ? "Kenku FM's player isn't ready yet"
              : playback?.playlist?.title || "Nothing playing"}
          </Typography>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700, minHeight: 20 }}>
            {track?.title || " "}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={track && track.duration ? (track.progress / track.duration) * 100 : 0}
            sx={{ mt: 0.75, height: 3, borderRadius: 2, bgcolor: "rgba(255,255,255,0.12)" }}
          />
          <Stack className="nodrag" direction="row" alignItems="center" sx={{ mt: 0.25 }}>
            <IconButton size="small" onClick={() => send(PREVIOUS)} disabled={!track}>
              <SkipPrevious />
            </IconButton>
            <IconButton
              onClick={() => send(playing ? PAUSE : RESUME)}
              disabled={!track}
              sx={{ mx: 0.25 }}
            >
              {playing ? <PauseRounded fontSize="large" /> : <PlayArrowRounded fontSize="large" />}
            </IconButton>
            <IconButton size="small" onClick={() => send(NEXT)} disabled={!track}>
              <SkipNext />
            </IconButton>
            <IconButton size="small" onClick={() => send(MUTE, !muted)} sx={{ ml: 0.5 }}>
              {muted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
            </IconButton>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(_, value) => {
                setDragVolume(value as number);
                window.mini.command(VOLUME, value as number);
              }}
              onChangeCommitted={() => setTimeout(() => setDragVolume(null), 600)}
              sx={{ mx: 1, flex: 1, minWidth: 40 }}
            />
          </Stack>
        </Box>
      </Box>

      {/* Search, only when there are enough playlists to need it */}
      {playlists.length > 8 && (
        <Stack
          direction="row"
          alignItems="center"
          sx={{ mx: 1, mt: 1, px: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.06)", flexShrink: 0 }}
        >
          <Search fontSize="small" sx={{ opacity: 0.5 }} />
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a playlist"
            sx={{ ml: 1, flex: 1, fontSize: 13, py: 0.25 }}
          />
        </Stack>
      )}

      {/* Playlists as buttons */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gridAutoRows: "62px",
          gap: 0.75,
          alignContent: "start",
        }}
      >
        {shown.map((playlist) => {
          const isCurrent = playback?.playlist?.id === playlist.id;
          const fav = favorites.includes(playlist.id);
          return (
            <Box
              key={playlist.id}
              className="tile"
              onClick={() => handleTile(playlist)}
              title={isCurrent ? (playing ? "Pause" : "Resume") : `Play ${playlist.title}`}
              sx={{
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: "background.paper",
                backgroundImage: playlist.image ? `url("${playlist.image}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                outline: isCurrent ? "2px solid" : "none",
                outlineColor: "primary.main",
                outlineOffset: -2,
                "&:hover .shade": { background: "linear-gradient(transparent 0%, rgba(0,0,0,0.55) 100%)" },
                "&:hover .star": { opacity: 1 },
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              <Box
                className="shade"
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75) 100%)",
                }}
              />
              <Typography
                variant="caption"
                noWrap
                component="div"
                sx={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  bottom: 4,
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                }}
              >
                {playlist.title}
              </Typography>
              {isCurrent && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 6,
                    top: 4,
                    display: "flex",
                    color: "primary.main",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))",
                  }}
                >
                  {playing ? <GraphicEq fontSize="small" /> : <PauseRounded fontSize="small" />}
                </Box>
              )}
              <IconButton
                className="star"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(playlist.id);
                }}
                title={fav ? "Remove from favorites" : "Add to favorites (shown first)"}
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  p: 0.5,
                  opacity: fav ? 1 : 0,
                  color: fav ? "#ffcf4a" : "white",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))",
                }}
              >
                {fav ? <Star sx={{ fontSize: 16 }} /> : <StarBorder sx={{ fontSize: 16 }} />}
              </IconButton>
            </Box>
          );
        })}
        {connected && playlists.length === 0 && (
          <Typography variant="caption" sx={{ opacity: 0.6, gridColumn: "1 / -1", p: 1 }}>
            No playlists yet. Add some in Kenku FM.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <MiniPlayer />
  </ThemeProvider>
);
