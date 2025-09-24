import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type {
  SubscriptionMessage,
  AISMessage,
  BoundingBox,
  VesselTrackingOptions,
  VesselInfo
} from './types.js';

export class AISStreamClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

        this.ws.on('open', () => {
          console.log('Connected to aisstream.io');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message: AISMessage = JSON.parse(data.toString());
            this.emit('message', message);
          } catch (error) {
            console.error('Failed to parse AIS message:', error);
            this.emit('error', error);
          }
        });

        this.ws.on('close', () => {
          console.log('Disconnected from aisstream.io');
          this.isConnected = false;
          this.emit('disconnected');
          this.handleReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

      setTimeout(() => {
        this.connect().catch(() => {
          this.handleReconnect();
        });
      }, this.reconnectDelay);

      this.reconnectDelay *= 2; // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectReached');
    }
  }

  subscribe(options: VesselTrackingOptions): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to aisstream.io');
    }

    const subscription: SubscriptionMessage = {
      APIKey: this.apiKey
    };

    if (options.boundingBox) {
      subscription.BoundingBoxes = [[
        [options.boundingBox.southWest[0], options.boundingBox.southWest[1]],
        [options.boundingBox.northEast[0], options.boundingBox.northEast[1]]
      ]];
    }

    if (options.mmsiList && options.mmsiList.length > 0) {
      subscription.FiltersShipMMSI = options.mmsiList;
    }

    if (options.messageTypes && options.messageTypes.length > 0) {
      subscription.FilterMessageTypes = options.messageTypes;
    }

    console.log('Sending subscription:', JSON.stringify(subscription, null, 2));
    this.ws.send(JSON.stringify(subscription));
  }

  async trackVessels(options: VesselTrackingOptions): Promise<VesselInfo[]> {
    return new Promise((resolve, reject) => {
      const vessels = new Map<string, VesselInfo>();
      const maxMessages = options.maxMessages || 100;
      const timeoutMs = options.timeoutMs || 30000;
      let messageCount = 0;

      const messageHandler = (message: AISMessage) => {
        if (message.MessageType === 'PositionReport' && message.Message.PositionReport) {
          const posReport = message.Message.PositionReport;
          const mmsi = posReport.UserID.toString();

          const vesselInfo: VesselInfo = {
            mmsi,
            latitude: posReport.Latitude,
            longitude: posReport.Longitude,
            course: posReport.Cog,
            speed: posReport.Sog,
            heading: posReport.Heading,
            timestamp: new Date().toISOString(),
            navigationalStatus: posReport.NavigationalStatus
          };

          vessels.set(mmsi, vesselInfo);
          messageCount++;

          if (messageCount >= maxMessages) {
            cleanup();
            resolve(Array.from(vessels.values()));
          }
        }
      };

      const cleanup = () => {
        this.removeListener('message', messageHandler);
        clearTimeout(timeoutId);
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(Array.from(vessels.values()));
      }, timeoutMs);

      this.on('message', messageHandler);
      this.subscribe(options);
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
  }
}