#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AISStreamClient } from './aisstream-client.js';
import type { BoundingBox, VesselTrackingOptions } from './types.js';

const API_KEY = process.env.AISSTREAM_API_KEY;
if (!API_KEY) {
  console.error('AISSTREAM_API_KEY environment variable is required');
  process.exit(1);
}

const server = new Server(
  {
    name: 'aisstream-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let aisClient: AISStreamClient | null = null;

async function getAISClient(): Promise<AISStreamClient> {
  if (!aisClient) {
    aisClient = new AISStreamClient(API_KEY!);
    await aisClient.connect();
  }
  return aisClient;
}

const tools: Tool[] = [
  {
    name: 'track_vessels',
    description: 'Get real-time vessel positions in a geographic area',
    inputSchema: {
      type: 'object',
      properties: {
        northLatitude: {
          type: 'number',
          description: 'Northern boundary latitude (-90 to 90)',
          minimum: -90,
          maximum: 90,
        },
        southLatitude: {
          type: 'number',
          description: 'Southern boundary latitude (-90 to 90)',
          minimum: -90,
          maximum: 90,
        },
        eastLongitude: {
          type: 'number',
          description: 'Eastern boundary longitude (-180 to 180)',
          minimum: -180,
          maximum: 180,
        },
        westLongitude: {
          type: 'number',
          description: 'Western boundary longitude (-180 to 180)',
          minimum: -180,
          maximum: 180,
        },
        maxMessages: {
          type: 'number',
          description: 'Maximum number of messages to collect (default: 50)',
          default: 50,
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)',
          default: 30000,
        },
      },
      required: ['northLatitude', 'southLatitude', 'eastLongitude', 'westLongitude'],
    },
  },
  {
    name: 'track_vessel_by_mmsi',
    description: 'Track specific vessels by their MMSI numbers',
    inputSchema: {
      type: 'object',
      properties: {
        mmsiList: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'List of MMSI numbers to track',
          minItems: 1,
        },
        maxMessages: {
          type: 'number',
          description: 'Maximum number of messages to collect (default: 20)',
          default: 20,
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 15000)',
          default: 15000,
        },
      },
      required: ['mmsiList'],
    },
  },
  {
    name: 'get_vessel_info',
    description: 'Get current information about vessels in a specific area with optional MMSI filtering',
    inputSchema: {
      type: 'object',
      properties: {
        northLatitude: {
          type: 'number',
          description: 'Northern boundary latitude (-90 to 90)',
          minimum: -90,
          maximum: 90,
        },
        southLatitude: {
          type: 'number',
          description: 'Southern boundary latitude (-90 to 90)',
          minimum: -90,
          maximum: 90,
        },
        eastLongitude: {
          type: 'number',
          description: 'Eastern boundary longitude (-180 to 180)',
          minimum: -180,
          maximum: 180,
        },
        westLongitude: {
          type: 'number',
          description: 'Western boundary longitude (-180 to 180)',
          minimum: -180,
          maximum: 180,
        },
        mmsiList: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Optional list of MMSI numbers to filter for',
        },
        messageTypes: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Message types to filter for (default: ["PositionReport"])',
          default: ['PositionReport'],
        },
        maxMessages: {
          type: 'number',
          description: 'Maximum number of messages to collect (default: 30)',
          default: 30,
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 20000)',
          default: 20000,
        },
      },
      required: ['northLatitude', 'southLatitude', 'eastLongitude', 'westLongitude'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || typeof args !== 'object') {
    throw new Error('Invalid arguments provided');
  }

  try {
    switch (name) {
      case 'track_vessels': {
        const client = await getAISClient();
        const boundingBox: BoundingBox = {
          northEast: [args.northLatitude as number, args.eastLongitude as number],
          southWest: [args.southLatitude as number, args.westLongitude as number],
        };

        const options: VesselTrackingOptions = {
          boundingBox,
          messageTypes: ['PositionReport'],
          maxMessages: (args.maxMessages as number) || 50,
          timeoutMs: (args.timeoutMs as number) || 30000,
        };

        const vessels = await client.trackVessels(options);

        return {
          content: [
            {
              type: 'text',
              text: `Found ${vessels.length} vessels in the specified area:\n\n${vessels
                .map(
                  (v) =>
                    `MMSI: ${v.mmsi}\n` +
                    `Position: ${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}\n` +
                    `Speed: ${v.speed.toFixed(1)} knots\n` +
                    `Course: ${v.course.toFixed(0)}°\n` +
                    `Heading: ${v.heading.toFixed(0)}°\n` +
                    `Status: ${v.navigationalStatus}\n` +
                    `Timestamp: ${v.timestamp}\n`
                )
                .join('\n')}`,
            },
          ],
        };
      }

      case 'track_vessel_by_mmsi': {
        const client = await getAISClient();
        const options: VesselTrackingOptions = {
          mmsiList: args.mmsiList as string[],
          messageTypes: ['PositionReport'],
          maxMessages: (args.maxMessages as number) || 20,
          timeoutMs: (args.timeoutMs as number) || 15000,
        };

        const vessels = await client.trackVessels(options);

        return {
          content: [
            {
              type: 'text',
              text: `Found ${vessels.length} vessels matching the specified MMSI numbers:\n\n${vessels
                .map(
                  (v) =>
                    `MMSI: ${v.mmsi}\n` +
                    `Position: ${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}\n` +
                    `Speed: ${v.speed.toFixed(1)} knots\n` +
                    `Course: ${v.course.toFixed(0)}°\n` +
                    `Heading: ${v.heading.toFixed(0)}°\n` +
                    `Status: ${v.navigationalStatus}\n` +
                    `Timestamp: ${v.timestamp}\n`
                )
                .join('\n')}`,
            },
          ],
        };
      }

      case 'get_vessel_info': {
        const client = await getAISClient();
        const boundingBox: BoundingBox = {
          northEast: [args.northLatitude as number, args.eastLongitude as number],
          southWest: [args.southLatitude as number, args.westLongitude as number],
        };

        const options: VesselTrackingOptions = {
          boundingBox,
          mmsiList: args.mmsiList as string[] | undefined,
          messageTypes: (args.messageTypes as string[]) || ['PositionReport'],
          maxMessages: (args.maxMessages as number) || 30,
          timeoutMs: (args.timeoutMs as number) || 20000,
        };

        const vessels = await client.trackVessels(options);

        return {
          content: [
            {
              type: 'text',
              text: `Retrieved information for ${vessels.length} vessels:\n\n${vessels
                .map(
                  (v) =>
                    `MMSI: ${v.mmsi}\n` +
                    `Position: ${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}\n` +
                    `Speed: ${v.speed.toFixed(1)} knots\n` +
                    `Course: ${v.course.toFixed(0)}°\n` +
                    `Heading: ${v.heading.toFixed(0)}°\n` +
                    `Status: ${v.navigationalStatus}\n` +
                    `Timestamp: ${v.timestamp}\n`
                )
                .join('\n')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (aisClient) {
      aisClient.disconnect();
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});