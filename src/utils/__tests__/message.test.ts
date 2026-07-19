import { nextTick, ref } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSseMessage, useWebSocketMessage } from '../message';

const { useEventSourceMock, useWebSocketMock } = vi.hoisted(() => ({
  useEventSourceMock: vi.fn(),
  useWebSocketMock: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useAppConfig: () => ({
    apiURL: 'http://api.example.test',
    clientId: 'test-client',
    sseEnable: true,
    websocketEnable: true,
  }),
}));

vi.mock('@/stores', () => ({
  useAccessStore: () => ({ accessToken: 'test-token' }),
}));

vi.mock('@vueuse/core', () => ({
  useEventSource: useEventSourceMock,
  useWebSocket: useWebSocketMock,
}));

describe('push message transports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes a replaced SSE connection without exposing control data', async () => {
    const close = vi.fn();
    const data = ref<null | string>(null);
    const event = ref<null | string>(null);
    useEventSourceMock.mockReturnValue({ close, data, event });

    useSseMessage();

    expect(useEventSourceMock).toHaveBeenCalledWith(
      'http://api.example.test/resource/message?clientid=test-client&Authorization=Bearer test-token',
      ['kicked'],
      expect.any(Object),
    );

    event.value = 'kicked';
    data.value = '';
    await nextTick();

    expect(close).toHaveBeenCalledOnce();
    expect(data.value).toBeNull();
  });

  it('consumes websocket pong as heartbeat instead of business data', () => {
    useWebSocketMessage();

    expect(useWebSocketMock).toHaveBeenCalledWith(
      'ws://api.example.test/resource/websocket?clientid=test-client&Authorization=Bearer test-token',
      expect.objectContaining({
        heartbeat: expect.objectContaining({
          message: '{"type":"ping"}',
          responseMessage: '{"type":"pong"}',
        }),
      }),
    );
  });

  it('does not reconnect a websocket replaced by the same token', () => {
    useWebSocketMessage();

    const options = useWebSocketMock.mock.calls[0]?.[1];
    const retries = options.autoReconnect.retries;
    expect(retries(0)).toBe(true);

    options.onDisconnected({}, { code: 4001 });

    expect(retries(0)).toBe(false);
  });
});
