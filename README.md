# GoatFunded World Cup

Landing page for the **GoatFunded World Cup** prediction tournament with live Polymarket World Cup odds, a trends chart, scrolling ticker, and bet calculator.

## Features

- Live World Cup odds ticker (Polymarket Gamma API)
- Real-time price trends chart (Polymarket CLOB WebSocket)
- World Cup winner market panel with $100K bet calculator
- Full tournament landing page (prizes, rules, FAQs, countdown)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Data sources

- [Polymarket Gamma API](https://docs.polymarket.com/api-reference/introduction) — market metadata and odds
- [Polymarket CLOB API](https://docs.polymarket.com/api-reference/markets/get-prices-history) — price history and live WebSocket updates
