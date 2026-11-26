import React, { useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import AddRounded from "@mui/icons-material/AddCircleRounded";
import Tooltip from "@mui/material/Tooltip";
import Backdrop from "@mui/material/Backdrop";
import Back from "@mui/icons-material/ChevronLeftRounded";
import styled from "@mui/material/styles/styled";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { PlaylistItem } from "./PlaylistItem";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { movePlaylist, Track, addPlaylist, addTracks } from "./playlistsSlice";
import { PlaylistAdd } from "./PlaylistAdd";
import { SortableItem } from "../../common/SortableItem";
import { startQueue } from "./playlistPlaybackSlice";
import { useFolderDrop } from "../../common/useFolderDrop";
import { getRandomBackground } from "../../backgrounds";
import { useHideScrollbar } from "../../../renderer/common/useHideScrollbar";
import { useRememberScroll } from "../../../renderer/common/useRememberScroll";
import { useNavigate } from "react-router-dom";
import { cardSizes, usePrefs } from "../../common/playerPrefs";
import { PlayerPrefsButton } from "./PlayerPrefsButton";

const WallPaper = styled("div")({
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  overflow: "hidden",
  background: "linear-gradient(#2D3143 0%, #1e2231 100%)",
  zIndex: -1,
});

type PlaylistsProps = {
  onPlay: (track: Track) => void;
  /** The playlist open beside the grid, when the screen is split */
  selectedId?: string;
};

export function Playlists({ onPlay, selectedId }: PlaylistsProps) {
  const navigate = useNavigate();
  const prefs = usePrefs();
  const size = cardSizes[prefs.cardSize];
  const split = Boolean(selectedId);

  function handleSelect(id: string) {
    // Inside the split view, swap the open playlist without piling up history
    navigate(`/playlists/${id}`, { replace: split });
  }
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.playlists);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const items = playlists.playlists.allIds.map(
    (id) => playlists.playlists.byId[id]
  );

  const [dragId, setDragId] = useState<string | null>(null);
  function handleDragStart(event: DragStartEvent) {
    setDragId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over.id) {
      dispatch(movePlaylist({ active: active.id, over: over.id }));
    }

    setDragId(null);
  }

  const [addOpen, setAddOpen] = useState(false);

  const { dragging, containerListeners, overlayListeners } = useFolderDrop(
    (directories) => {
      for (let directory of Object.values(directories)) {
        const files = directory.audioFiles;
        if (files.length > 0 && directory.path !== "/") {
          const id = uuid();
          dispatch(
            addPlaylist({
              id,
              background: getRandomBackground(),
              title: directory.name,
              tracks: [],
            })
          );
          dispatch(addTracks({ tracks: files, playlistId: id }));
        }
      }
    }
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const hideScrollbar = useHideScrollbar(scrollRef);
  useRememberScroll(scrollRef, "playlists");

  return (
    <>
      <WallPaper />
      <Container
        maxWidth={false}
        sx={{
          padding: "0px !important",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
        {...containerListeners}
      >
        <Stack
          p={4}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          {split ? (
            <Box sx={{ width: 40, mr: "40px" }} />
          ) : (
            <IconButton onClick={() => navigate(-1)} sx={{ mr: "40px" }}>
              <Back />
            </IconButton>
          )}
          <Typography variant={split ? "h4" : "h3"} noWrap>
            Playlists
          </Typography>
          <Stack direction="row">
            <PlayerPrefsButton />
            <Tooltip title="Add Playlist">
              <IconButton onClick={() => setAddOpen(true)}>
                <AddRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${size.minWidth}px, 1fr))`,
            alignContent: "start",
            gap: 2,
            px: 2,
            pb: "248px",
            overflowY: "auto",
            maskImage:
              "linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
          ref={scrollRef}
          {...hideScrollbar}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={rectSortingStrategy}>
              {items.map((playlist) => (
                <SortableItem id={playlist.id} key={playlist.id}>
                  <PlaylistItem
                    playlist={playlist}
                    onSelect={handleSelect}
                    onPlay={onPlay}
                    selected={playlist.id === selectedId}
                  />
                </SortableItem>
              ))}
              <DragOverlay>
                {dragId ? (
                  <PlaylistItem
                    playlist={playlists.playlists.byId[dragId]}
                    onSelect={() => {}}
                    onPlay={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </SortableContext>
          </DndContext>
        </Box>
        <Backdrop
          open={dragging}
          sx={{ zIndex: 100, bgcolor: "rgba(0, 0, 0, 0.8)" }}
          {...overlayListeners}
        >
          <Typography sx={{ pointerEvents: "none" }}>
            Drop the playlists here...
          </Typography>
        </Backdrop>
      </Container>
      <PlaylistAdd open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
