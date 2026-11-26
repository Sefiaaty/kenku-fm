import React, { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Tune from "@mui/icons-material/TuneRounded";

import { CardSize, setPrefs, usePrefs } from "../../common/playerPrefs";

function seconds(value: number) {
  return value === 0 ? "Off" : `${value}s`;
}

export function PlayerPrefsButton() {
  const prefs = usePrefs();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="View and Fades">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Tune />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Stack p={2} gap={2} sx={{ width: 260 }}>
          <Stack gap={1}>
            <Typography variant="caption">Card size</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={prefs.cardSize}
              onChange={(_, value: CardSize | null) => {
                if (value) {
                  setPrefs({ cardSize: value });
                }
              }}
            >
              <ToggleButton value="small">Small</ToggleButton>
              <ToggleButton value="medium">Medium</ToggleButton>
              <ToggleButton value="large">Large</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack>
            <Typography variant="caption">
              Fade out on pause: {seconds(prefs.pauseFade)}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={5}
              step={0.5}
              value={prefs.pauseFade}
              onChange={(_, value) => setPrefs({ pauseFade: value as number })}
            />
          </Stack>
          <Stack>
            <Typography variant="caption">
              Fade out when switching playlists: {seconds(prefs.switchFade)}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={6}
              step={0.5}
              value={prefs.switchFade}
              onChange={(_, value) => setPrefs({ switchFade: value as number })}
            />
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
