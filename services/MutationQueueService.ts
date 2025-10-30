import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createLogger } from '@/lib/utils/logger';

export interface QueuedMutation {
  id: string;
  type: 'upsert' | 'delete' | 'bulk-sync';
  collection: string;
  payload: any;
  timestamp: number;
  retries: number;
  error?: string;
}

export interface MutationHandler {
  upsert?: (payload: any) => Promise<void>;
  delete?: (payload: any) => Promise<void>;
  bulkSync?: (payload: any) => Promise<void>;
}

const QUEUE_STORAGE_KEY = '@mutation_queue';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

class MutationQueueService {
  private handlers: Map<string, MutationHandler> = new Map();
  private isProcessing = false;
  private networkUnsubscribe?: (() => void) | null = null;
  private logger = createLogger('MutationQueueService');

  /**
   * Register handlers for a specific collection
   */
  registerHandler(collection: string, handler: MutationHandler) {
    this.handlers.set(collection, handler);
  }

  /**
   * Add a mutation to the queue
   */
  async enqueueMutation(
    collection: string,
    type: 'upsert' | 'delete' | 'bulk-sync',
    payload: any
  ): Promise<void> {
    const mutation: QueuedMutation = {
      id: `${collection}_${type}_${Date.now()}_${Math.random()}`,
      type,
      collection,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = await this.getQueue();
    queue.push(mutation);
    await this.saveQueue(queue);

    // Try to process immediately if online
    this.processQueue().catch(err => {
      console.warn('Failed to process queue immediately:', err);
    });
  }

  /**
   * Get all pending mutations
   */
  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) return [];
      return JSON.parse(queueJson);
    } catch (error) {
      console.error('Failed to load mutation queue:', error);
      return [];
    }
  }

  /**
   * Save the queue to storage
   */
  private async saveQueue(queue: QueuedMutation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save mutation queue:', error);
      throw error;
    }
  }

  /**
   * Process all pending mutations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      const remainingQueue: QueuedMutation[] = [];
      const processed: string[] = [];

      for (const mutation of queue) {
        const handler = this.handlers.get(mutation.collection);

        if (!handler) {
          console.warn(`No handler registered for collection: ${mutation.collection}`);
          // Keep in queue, might register handler later
          remainingQueue.push(mutation);
          continue;
        }

        try {
          // Execute the mutation
          if (mutation.type === 'upsert' && handler.upsert) {
            await handler.upsert(mutation.payload);
          } else if (mutation.type === 'delete' && handler.delete) {
            await handler.delete(mutation.payload);
          } else if (mutation.type === 'bulk-sync' && handler.bulkSync) {
            await handler.bulkSync(mutation.payload);
          } else {
            console.warn(`No handler for mutation type: ${mutation.type}`);
            remainingQueue.push(mutation);
            continue;
          }

          processed.push(mutation.id);
        } catch (error) {
          mutation.retries += 1;
          mutation.error = error instanceof Error ? error.message : String(error);

          if (mutation.retries >= MAX_RETRIES) {
            console.error(
              `Mutation ${mutation.id} failed after ${MAX_RETRIES} retries:`,
              error
            );
            // Optionally: move to a "dead letter queue" or discard
            // For now, we'll keep it in the queue but log the error
          }

          // Keep in queue for retry
          remainingQueue.push(mutation);
        }

        // Small delay between mutations to avoid overwhelming the server
        if (queue.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Save the remaining queue
      await this.saveQueue(remainingQueue);

      if (processed.length > 0) {
        this.logger.info(`Processed ${processed.length} mutations from queue`);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all mutations for a specific collection
   */
  async clearCollection(collection: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((mutation: QueuedMutation) => mutation.collection !== collection);
    await this.saveQueue(filtered);
  }

  /**
   * Clear the entire queue
   */
  async clearQueue(): Promise<void> {
    await this.saveQueue([]);
  }

  /**
   * Get pending mutation count
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Get pending mutations for a specific collection
   */
  async getPendingForCollection(collection: string): Promise<QueuedMutation[]> {
    const queue = await this.getQueue();
    return queue.filter((mutation: QueuedMutation) => mutation.collection === collection);
  }

  /**
   * Start monitoring network connectivity and auto-process queue when online
   */
  startNetworkMonitoring(): void {
    if (this.networkUnsubscribe) {
      return; // Already monitoring
    }

    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Network became available, process queue
        this.processQueue().catch(err => {
          console.warn('Failed to process queue on network change:', err);
        });
      }
    });
  }

  /**
   * Stop monitoring network connectivity
   */
  stopNetworkMonitoring(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }

  /**
   * Retry failed mutations with exponential backoff
   */
  async retryWithBackoff(mutation: QueuedMutation): Promise<void> {
    const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, mutation.retries), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.processQueue();
  }
}

export default new MutationQueueService();
