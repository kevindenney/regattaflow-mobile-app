import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  NURSING_CORE_V1_CAPABILITIES,
  NURSING_CORE_V1_CATALOG_ID,
} from '../../../configs/competencies/nursing-core-v1';

export function registerCompetencyCatalogResource(server: McpServer) {
  server.resource(
    'AACN Nursing Competency Catalog (nursing-core-v1)',
    `betterat://competencies/${NURSING_CORE_V1_CATALOG_ID}`,
    async () => ({
      contents: [
        {
          uri: `betterat://competencies/${NURSING_CORE_V1_CATALOG_ID}`,
          mimeType: 'application/json',
          text: JSON.stringify(NURSING_CORE_V1_CAPABILITIES, null, 2),
        },
      ],
    }),
  );
}
