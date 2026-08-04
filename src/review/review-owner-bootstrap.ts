#!/usr/bin/env node
import * as path from 'path';
import { startReviewHeartbeatOwner, type ReviewHeartbeatOwner } from './review-heartbeat-owner';
import { startReviewWorkbenchOwner, type ReviewWorkbenchOwner } from './review-workbench-owner';

async function main(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  let heartbeat: ReviewHeartbeatOwner | undefined;
  let workbench: ReviewWorkbenchOwner | undefined;
  try {
    heartbeat = await startReviewHeartbeatOwner({ projectRoot });
    workbench = await startReviewWorkbenchOwner({ projectRoot });
    if (!heartbeat || !workbench) throw new Error('Review owners are not enabled or their workspace is unavailable');
  } catch (error) {
    await Promise.allSettled([heartbeat?.stop(), workbench?.stop()].filter(Boolean) as Promise<void>[]);
    throw error;
  }

  await new Promise<void>(resolve => {
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      await Promise.allSettled([heartbeat!.stop(), workbench!.stop()]);
      resolve();
    };
    process.once('SIGINT', () => void stop());
    process.once('SIGTERM', () => void stop());
  });
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${String(error?.message || error)}\n`);
    process.exitCode = 1;
  });
}
