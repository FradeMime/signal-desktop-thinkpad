// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from 'zod';
import type { LoggerType } from '../types/Logging';
import { exponentialBackoffMaxAttempts } from '../util/exponentialBackoff';
import { receiptSchema, ReceiptType } from '../types/Receipt';
import { MAX_RETRY_TIME, runReceiptJob } from './helpers/receiptHelpers';

import { JobQueue } from './JobQueue';
import { jobQueueDatabaseStore } from './JobQueueDatabaseStore';

const viewedReceiptsJobDataSchema = z.object({ viewedReceipt: receiptSchema });

type ViewedReceiptsJobData = z.infer<typeof viewedReceiptsJobDataSchema>;

export class ViewedReceiptsJobQueue extends JobQueue<ViewedReceiptsJobData> {
  protected parseData(data: unknown): ViewedReceiptsJobData {
    return viewedReceiptsJobDataSchema.parse(data);
  }

  protected async run(
    {
      data,
      timestamp,
    }: Readonly<{ data: ViewedReceiptsJobData; timestamp: number }>,
    { attempt, log }: Readonly<{ attempt: number; log: LoggerType }>
  ): Promise<void> {
    await runReceiptJob({
      attempt,
      log,
      timestamp,
      receipts: [data.viewedReceipt],
      type: ReceiptType.Viewed,
    });
  }
}

export const viewedReceiptsJobQueue = new ViewedReceiptsJobQueue({
  store: jobQueueDatabaseStore,
  queueType: 'viewed receipts',
  maxAttempts: exponentialBackoffMaxAttempts(MAX_RETRY_TIME),
});
