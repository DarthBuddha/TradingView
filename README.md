# Darth Buddha TradingView Scripts

Custom Pine Script indicators focused on structure, sessions, and volume/flow context.

## Script List

- Buddha Bands: Four SMA bands using 20-21, 50-55, 200-233, and 365-377 ranges.
- Buddha Money Flow: Footprint-based buy/sell/delta flow panel and histogram.
- Buddha Squeeze: TTM Squeeze style momentum/volatility oscillator.
- Market Levels: Auto-draws key market levels.
- Market Sessions: Session tracker for trading day structure.
- Price Line: Current price display helper.
- Money Flow: Buy vs sell volume histogram.

## Buddha Money Flow

`BuddhaMoneyFlow.pine` now uses TradingView footprint data instead of candle-position estimation.

What this means:

- Buy, sell, total volume, and delta are requested from `request.footprint()`.
- Values are generally closer to order-flow style volume accounting than a close-in-range proxy.
- Display can keep columns above zero for readability without changing signed math.

Key inputs:

- Footprint: `Ticks Per Row`, `Value Area %`, `Imbalance %`
- Display: `Show Total Volume`, `Show Table`, `Columns Above Zero`, `CVD Mode`, `CVD Window`

Notes:

- Footprint availability depends on TradingView plan and symbol/feed support.
- If footprint data is unavailable on a bar, output can return `na` for that bar.
- Differences between footprint totals and regular `volume` can occur depending on data feed behavior.

## How To Use

1. Open TradingView Pine Editor.
2. Paste a script from `src/`.
3. Save and add it to chart.
4. Tune inputs for your market and timeframe.

## Repository Layout

- `src/BuddhaBands.pine`
- `src/BuddhaMoneyFlow.pine`
- `src/BuddhaSqueeze.pine`
- `src/MarketLevels.pine`
- `src/MarketSessions.pine`
- `src/PriceLine.pine`
- `src/MoneyFlow.pine`

## Author

- Darth Buddha: [DarthBuddha on GitHub](https://github.com/DarthBuddha)
