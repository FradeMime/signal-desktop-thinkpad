// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';

export type PropsType = {
  renderCompositionArea: () => JSX.Element;
  renderConversationHeader: () => JSX.Element;
  renderTimeline: () => JSX.Element;
};

// 右侧聊天界面
export const ConversationView = ({
  renderCompositionArea,
  renderConversationHeader,
  renderTimeline,
}: PropsType): JSX.Element => {
  return (
    <div className="ConversationView">
      {/* header 头 包含联系人号码/选项 视频 语音 搜索等 */}
      <div className="ConversationView__header">
        {renderConversationHeader()}
      </div>
      <div className="ConversationView__pane main panel">
        {/* timeline--container 聊天信息展示部分发送内容和接收内容 */}
        <div className="ConversationView__timeline--container">
          <div aria-live="polite" className="ConversationView__timeline">
            {renderTimeline()}
          </div>
        </div>
        {/* 聊天输入栏 表情 附件 语音 发送功能 */}
        <div className="ConversationView__composition-area">
          {renderCompositionArea()}
        </div>
      </div>
    </div>
  );
};
