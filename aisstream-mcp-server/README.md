# AISStream MCP Server

A Model Context Protocol (MCP) server for accessing real-time maritime vessel data from aisstream.io.

## Features

- Real-time vessel tracking via WebSocket connection to aisstream.io
- Geographic filtering with bounding boxes
- Vessel filtering by MMSI (Maritime Mobile Service Identity)
- Message type filtering (e.g., PositionReport)
- Secure API key authentication

## Setup

1. Sign up at [aisstream.io](https://aisstream.io) and generate an API key
2. Install dependencies: `npm install`
3. Build the server: `npm run build`
4. Set your API key as an environment variable: `export AISSTREAM_API_KEY=your_api_key_here`
5. Start the server: `npm start`

## MCP Tools

- `track_vessels`: Get real-time vessel positions in a geographic area
- `track_vessel_by_mmsi`: Track a specific vessel by its MMSI number
- `get_vessel_info`: Get current information about vessels in an area

## Configuration

The server accepts the following environment variables:

- `AISSTREAM_API_KEY`: Your aisstream.io API key (required)
- `MCP_SERVER_NAME`: Server name for MCP (default: "aisstream")