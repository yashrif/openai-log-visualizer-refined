import test from 'node:test';
import assert from 'node:assert/strict';

import { processLogContent } from '../src/lib/client-log-processor';
import { getEventCategory } from '../src/lib/log-parser';

function logLine(timestamp: string, payload: Record<string, unknown>): string {
  return `${timestamp} [session_test] [OPENAI] ${JSON.stringify(payload)}`;
}

function toBase64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

test('groups custom audio_delta envelopes and merges independently encoded PCM chunks by bytes', () => {
  const content = [
    logLine('2026-01-01T00:00:00.000Z', {
      type: 'audio_delta',
      request_id: 'req_audio_1',
      data: { audio: toBase64([1, 2]) },
    }),
    logLine('2026-01-01T00:00:00.010Z', {
      type: 'audio_delta',
      request_id: 'req_audio_1',
      data: { audio: toBase64([3, 4]) },
    }),
    logLine('2026-01-01T00:00:00.020Z', {
      type: 'response_audio_transcript_done',
      request_id: 'req_audio_1',
      data: { transcript: 'hello from custom envelope' },
    }),
    logLine('2026-01-01T00:00:00.030Z', {
      type: 'audio_done',
      request_id: 'req_audio_1',
    }),
  ].join('\n');

  const result = processLogContent(content);
  const responseItem = result.conversationItems.find(item => item.type === 'response_group');

  assert.ok(responseItem?.responseGroup);
  assert.equal(responseItem.responseGroup.responseId, 'req_audio_1');
  assert.equal(responseItem.responseGroup.audioChunkCount, 2);
  assert.equal(responseItem.responseGroup.transcript, 'hello from custom envelope');
  assert.deepEqual(
    Array.from(Buffer.from(responseItem.responseGroup.audioData ?? '', 'base64')),
    [1, 2, 3, 4]
  );
});

test('groups valid middleware response text events by request_id', () => {
  const content = [
    logLine('2026-01-01T00:01:00.000Z', {
      type: 'response_created',
      request_id: 'req_text_1',
    }),
    logLine('2026-01-01T00:01:00.010Z', {
      type: 'response_text_delta',
      request_id: 'req_text_1',
      delta: 'Hel',
    }),
    logLine('2026-01-01T00:01:00.020Z', {
      type: 'response_text_delta',
      request_id: 'req_text_1',
      data: { text: 'lo' },
    }),
    logLine('2026-01-01T00:01:00.030Z', {
      type: 'response_text_done',
      request_id: 'req_text_1',
      text: 'Hello',
    }),
    logLine('2026-01-01T00:01:00.040Z', {
      type: 'response_done',
      request_id: 'req_text_1',
    }),
  ].join('\n');

  const result = processLogContent(content);
  const responseItem = result.conversationItems.find(item => item.type === 'response_group');

  assert.ok(responseItem?.responseGroup);
  assert.equal(responseItem.responseGroup.responseId, 'req_text_1');
  assert.equal(responseItem.responseGroup.type, 'text_response');
  assert.equal(responseItem.responseGroup.status, 'completed');
  assert.equal(responseItem.responseGroup.textContent, 'Hello');
});

test('groups valid middleware function-call events by request_id', () => {
  const content = [
    logLine('2026-01-01T00:02:00.000Z', {
      type: 'function_call_args_delta',
      request_id: 'req_fn_1',
      delta: '{"house_id":',
    }),
    logLine('2026-01-01T00:02:00.010Z', {
      type: 'function_call_args_delta',
      request_id: 'req_fn_1',
      data: { delta: '42}' },
    }),
    logLine('2026-01-01T00:02:00.020Z', {
      type: 'function_call_args_done',
      request_id: 'req_fn_1',
      name: 'get_qr_code',
    }),
    logLine('2026-01-01T00:02:00.030Z', {
      type: 'response_done',
      request_id: 'req_fn_1',
    }),
  ].join('\n');

  const result = processLogContent(content);
  const responseItem = result.conversationItems.find(item => item.type === 'response_group');

  assert.ok(responseItem?.responseGroup);
  assert.equal(responseItem.responseGroup.responseId, 'req_fn_1');
  assert.equal(responseItem.responseGroup.type, 'function_call');
  assert.equal(responseItem.responseGroup.status, 'completed');
  assert.equal(responseItem.responseGroup.functionName, 'get_qr_code');
  assert.deepEqual(responseItem.responseGroup.functionArguments, { house_id: 42 });
});

test('classifies exact middleware and OpenAI event names from backend enums', () => {
  assert.equal(getEventCategory('input_audio_buffer.commit'), 'user_input');
  assert.equal(getEventCategory('conversation.input.text'), 'user_input');
  assert.equal(getEventCategory('response_created'), 'response');
  assert.equal(getEventCategory('response_text_delta'), 'response');
  assert.equal(getEventCategory('conversation_item_created'), 'system');
  assert.equal(getEventCategory('input_audio_buffer_committed'), 'system');
  assert.equal(getEventCategory('rate_limits_updated'), 'system');
  assert.equal(getEventCategory('function_call_args_delta'), 'function_call');
});
