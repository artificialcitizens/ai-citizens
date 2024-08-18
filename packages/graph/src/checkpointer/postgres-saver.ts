import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  SerializerProtocol,
} from "@langchain/langgraph";
import { load } from "@langchain/core/load";

import pkg from "pg";

// Define the Pool type
type Pool = pkg.Pool;
// Get the Pool constructor
const { Pool } = pkg;
import { RunnableConfig } from "@langchain/core/runnables";

// define custom serializer, since we'll be using bytea Postgres type for `checkpoint` and `metadata` values
const CustomSerializer = {
  stringify(obj) {
    return Buffer.from(JSON.stringify(obj));
  },

  async parse(data) {
    return await load(data.toString());
  },
};

// snake_case is used to match Python implementation
interface Row {
  checkpoint: string;
  metadata: string;
  parent_id?: string;
  thread_id: string;
  checkpoint_id: string;
}

/**
 * @example
 * ```ts
 * const pool = new Pool({
  host: 'localhost',
  port: 54321,
  database: 'electric',
  user: 'postgres',
  password: 'password',
});
const saver = new PostgresSaver(pool);
 * ```
 * @example
 * ```ts
 * const saver = PostgresSaver.fromConnString("postgresql://postgres:password@localhost:54321/electric\");
 * ```
 */
export class PostgresSaver extends BaseCheckpointSaver {
  private pool: Pool;
  private isSetup: boolean;

  constructor(pool: Pool) {
    // @ts-ignore
    super(CustomSerializer);
    this.pool = pool;
    this.isSetup = false;
  }

  static fromConnString(connString: string): PostgresSaver {
    return new PostgresSaver(new Pool({ connectionString: connString }));
  }

  private async setup(): Promise<void> {
    if (this.isSetup) return;

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS checkpoints (
          thread_id TEXT NOT NULL,
          checkpoint_id TEXT NOT NULL,
          parent_id TEXT,
          checkpoint BYTEA NOT NULL,
          metadata BYTEA NOT NULL,
          PRIMARY KEY (thread_id, checkpoint_id)
        );
      `);
      this.isSetup = true;
    } catch (error) {
      console.error("Error creating checkpoints table", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // below 3 methods are necessary for any checkpointer implementation: getTuple, list and put
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple> {
    await this.setup();
    const { thread_id, checkpoint_id } = config.configurable || {};

    const client = await this.pool.connect();
    try {
      if (checkpoint_id) {
        const res = await client.query(
          `SELECT checkpoint, parent_id, metadata FROM checkpoints WHERE thread_id = $1 AND checkpoint_id = $2`,
          [thread_id, checkpoint_id]
        );
        const row = res.rows[0];
        if (row) {
          return {
            config,
            checkpoint: (await this.serde.parse(row.checkpoint)) as Checkpoint,
            metadata: (await this.serde.parse(
              row.metadata
            )) as CheckpointMetadata,
            parentConfig: row.parent_id
              ? {
                  configurable: {
                    thread_id,
                    checkpoint_id: row.parent_id,
                  },
                }
              : undefined,
          };
        }
      } else {
        const res = await client.query(
          `SELECT thread_id, checkpoint_id, parent_id, checkpoint, metadata FROM checkpoints WHERE thread_id = $1 ORDER BY checkpoint_id DESC LIMIT 1`,
          [thread_id]
        );
        const row = res.rows[0];
        if (row) {
          return {
            config: {
              configurable: {
                thread_id: row.thread_id,
                checkpoint_id: row.checkpoint_id,
              },
            },
            checkpoint: (await this.serde.parse(row.checkpoint)) as Checkpoint,
            metadata: (await this.serde.parse(
              row.metadata
            )) as CheckpointMetadata,
            parentConfig: row.parent_id
              ? {
                  configurable: {
                    thread_id: row.thread_id,
                    checkpoint_id: row.parent_id,
                  },
                }
              : undefined,
          };
        }
      }
    } catch (error) {
      console.error("Error retrieving checkpoint", error);
      throw error;
    } finally {
      client.release();
    }

    return undefined;
  }

  async *list(
    config: RunnableConfig,
    limit?: number,
    before?: RunnableConfig
  ): AsyncGenerator<CheckpointTuple, any, unknown> {
    await this.setup();
    const { thread_id } = config.configurable || {};
    let query = `SELECT thread_id, checkpoint_id, parent_id, checkpoint, metadata FROM checkpoints WHERE thread_id = $1`;
    const params: (string | number)[] = [thread_id];
    if (before?.configurable?.checkpoint_id) {
      query += " AND checkpoint_id < $2";
      params.push(before.configurable.checkpoint_id);
    }
    query += " ORDER BY checkpoint_id DESC";
    if (limit) {
      query += " LIMIT $" + (params.length + 1);
      params.push(limit);
    }

    const client = await this.pool.connect();
    try {
      const res = await client.query(query, params);
      for (const row of res.rows) {
        yield {
          config: {
            configurable: {
              thread_id: row.thread_id,
              checkpoint_id: row.checkpoint_id,
            },
          },
          checkpoint: (await this.serde.parse(row.checkpoint)) as Checkpoint,
          metadata: (await this.serde.parse(
            row.metadata
          )) as CheckpointMetadata,
          parentConfig: row.parent_id
            ? {
                configurable: {
                  thread_id: row.thread_id,
                  checkpoint_id: row.parent_id,
                },
              }
            : undefined,
        };
      }
    } catch (error) {
      console.error("Error listing checkpoints", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deletes all checkpoints associated with a specific thread_id.
   * @param threadId The thread_id of the checkpoints to delete.
   * @example
   * ```ts
   * const saver = new PostgresSaver(pool);
   * await saver.resetThread('some-thread-id');
   * ```
   */
  async resetThread(threadId: string): Promise<void> {
    await this.setup();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM checkpoints WHERE thread_id = $1",
        [threadId]
      );
      console.log(
        `Deleted ${result.rowCount} checkpoints for thread_id: ${threadId}`
      );
    } catch (error) {
      console.error(`Error resetting thread ${threadId}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deletes all rows from the checkpoints table.
   * Use with caution as this operation cannot be undone.
   * @example
   * ```ts
   * const saver = new PostgresSaver(pool);
   * await saver.hardReset();
   * ```
   */
  async hardReset(): Promise<void> {
    await this.setup();
    const client = await this.pool.connect();
    try {
      await client.query("DELETE FROM checkpoints");
      console.log("All checkpoints have been deleted.");
    } catch (error) {
      console.error("Error performing hard reset", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    await this.setup();
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO checkpoints (thread_id, checkpoint_id, parent_id, checkpoint, metadata) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (thread_id, checkpoint_id) DO UPDATE SET checkpoint = EXCLUDED.checkpoint, metadata = EXCLUDED.metadata`,
        [
          config.configurable?.thread_id,
          checkpoint.id,
          config.configurable?.checkpoint_id,
          this.serde.stringify(checkpoint),
          this.serde.stringify(metadata),
        ]
      );
    } catch (error) {
      console.error("Error saving checkpoint", error);
      throw error;
    } finally {
      client.release();
    }

    return {
      configurable: {
        thread_id: config.configurable?.thread_id,
        checkpoint_id: checkpoint.id,
      },
    };
  }
}
