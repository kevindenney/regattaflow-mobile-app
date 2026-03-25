import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  NURSING_AACN_DOMAINS,
  NURSING_CORE_V1_CATALOG_ID,
} from '../../../configs/competencies/nursing-core-v1';

export function registerAacnDomainsResource(server: McpServer) {
  server.resource(
    'AACN Domain Definitions',
    `betterat://competencies/${NURSING_CORE_V1_CATALOG_ID}/domains`,
    async () => ({
      contents: [
        {
          uri: `betterat://competencies/${NURSING_CORE_V1_CATALOG_ID}/domains`,
          mimeType: 'application/json',
          text: JSON.stringify(NURSING_AACN_DOMAINS, null, 2),
        },
      ],
    }),
  );
}
