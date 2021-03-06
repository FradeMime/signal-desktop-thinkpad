// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { debounce, isNumber } from 'lodash';

import { strictAssert } from './assert';
import Data from '../sql/Client';
import * as log from '../logging/log';

let receivedAtCounter: number | undefined;

// 初始化消息计数器
export async function initializeMessageCounter(): Promise<void> {
  strictAssert(
    receivedAtCounter === undefined,
    'incrementMessageCounter: already initialized'
  );
  log.info('初始化消息计数器');
  // 关于本地存储 localStorage是否需要考虑使用
  // https://juejin.cn/post/7048976403349536776
  // 来加密数据优化
  const storedCounter = Number(localStorage.getItem('lastReceivedAtCounter'));
  const dbCounter = await Data.getMaxMessageCounter();
  log.info(`storedCounter:${storedCounter};dbCounter:${dbCounter}`);

  if (isNumber(dbCounter) && isNumber(storedCounter)) {
    log.info('initializeMessageCounter: picking max of db/stored counters');
    receivedAtCounter = Math.max(dbCounter, storedCounter);

    if (receivedAtCounter !== storedCounter) {
      log.warn('initializeMessageCounter: mismatch between db/stored counters');
    }
  } else if (isNumber(storedCounter)) {
    log.info('initializeMessageCounter: picking stored counter');
    receivedAtCounter = storedCounter;
  } else if (isNumber(dbCounter)) {
    log.info(
      'initializeMessageCounter: picking fallback counter from the database'
    );
    receivedAtCounter = dbCounter;
  } else {
    log.info('initializeMessageCounter: defaulting to Date.now()');
    receivedAtCounter = Date.now();
  }

  if (storedCounter !== receivedAtCounter) {
    localStorage.setItem('lastReceivedAtCounter', String(receivedAtCounter));
  }
}

export function incrementMessageCounter(): number {
  strictAssert(
    receivedAtCounter !== undefined,
    'incrementMessageCounter: not initialized'
  );

  receivedAtCounter += 1;
  debouncedUpdateLastReceivedAt();

  return receivedAtCounter;
}

export function flushMessageCounter(): void {
  debouncedUpdateLastReceivedAt.flush();
}

const debouncedUpdateLastReceivedAt = debounce(
  () => {
    localStorage.setItem('lastReceivedAtCounter', String(receivedAtCounter));
  },
  25,
  {
    maxWait: 25,
  }
);
