// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ConversationController } from './ConversationController';
import type { ConversationModel } from './models/conversations';
import type SendMessage from './textsecure/SendMessage';
import { assert } from './util/assert';
import { getOwn } from './util/getOwn';
import { isNotNil } from './util/isNotNil';
import * as log from './logging/log';

export async function updateConversationsWithUuidLookup({
  conversationController,
  conversations,
  messaging,
}: Readonly<{
  conversationController: Pick<
    ConversationController,
    'ensureContactIds' | 'get'
  >;
  conversations: ReadonlyArray<ConversationModel>;
  messaging: Pick<SendMessage, 'getUuidsForE164s'>;
}>): Promise<void> {
  log.info('updateConversationsWithUuidLookup 发现contact');
  const e164s = conversations
    .map(conversation => conversation.get('e164'))
    .filter(isNotNil);
  log.info(`e164s:${e164s}`);
  if (!e164s.length) {
    return;
  }

  const serverLookup = await messaging.getUuidsForE164s(e164s);

  conversations.forEach(conversation => {
    const e164 = conversation.get('e164');
    if (!e164) {
      return;
    }

    let finalConversation: ConversationModel;

    const uuidFromServer = getOwn(serverLookup, e164);
    if (uuidFromServer) {
      const finalConversationId = conversationController.ensureContactIds({
        e164,
        uuid: uuidFromServer,
        highTrust: true,
      });
      const maybeFinalConversation =
        conversationController.get(finalConversationId);
      assert(
        maybeFinalConversation,
        'updateConversationsWithUuidLookup: expected a conversation to be found or created'
      );
      finalConversation = maybeFinalConversation;
    } else {
      finalConversation = conversation;
    }

    if (!finalConversation.get('e164') || !finalConversation.get('uuid')) {
      finalConversation.setUnregistered();
    }
  });
}
