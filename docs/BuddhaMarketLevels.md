# Buddha Market Levels - Maintenance Notes

## Purpose

Buddha Market Levels draws intraday key levels (today, yesterday, overnight, premarket, after-hours, open/close) and opening ranges.

## Data Flow

1. Pulls lower-timeframe bars (1-minute arrays) with a sub-minute fallback.
2. Computes intraday session segments (market, premarket, overnight, after-hours).
3. Updates key level values on each new 1-minute event.
4. Renders lines, labels, and opening-range overlays.

## Opening Range System

There are two layers:

1. Primary Opening Range

- Controlled by Opening Range inputs and Anchor.
- Renders the main OH/OL pair and opening-range box.

1. Supplemental Session Opening Ranges

- Optional overlays for:
  - Globex (session start, typically 18:00 ET for futures)
  - New York (default 09:30)
  - London (default 03:00)
  - Asia (default 20:00)
- Each session tracks high/low during its opening window (`Range` minutes).
- Each session renders dashed high/low lines plus labels.

## Important Variables

- `openingMins`: primary opening-range time window.
- `sessionOpeningMins`, `nyOpeningMins`, `londonOpeningMins`, `asiaOpeningMins`: supplemental OR windows.
- `newOneMinueBar`: gate that drives session/segment updates.
- `sessionOr*`, `nyOr*`, `londonOr*`, `asiaOr*`: runtime state and drawing handles for each OR track.

## Session Reset Behavior

At a detected new session:

- Existing OR lines/labels are deleted.
- Session OR state is reset.
- New values are built from incoming bars.

## Editing Rules (to avoid Pine errors)

- Do not update global `line` or `label` variables from inside helper functions.
- Keep object creation/deletion in global bar-by-bar scope.
- Preserve sub-minute compatibility logic in `GetOneMinBarVals()` and `newOneMinueBar`.

## Next Improvements

- Add per-session range length inputs (separate minutes for Globex/NY/London/Asia).
- Add per-session line style options.
- Add optional timezone profile presets for different instruments.
- Add a debug mode to print active segment and current OR state.
