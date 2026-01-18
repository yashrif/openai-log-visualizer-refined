# OpenAI Log Visualizer (Refined)

A refined interface for visualizing OpenAI Realtime API logs, built with Next.js.
It transforms raw log files into an interactive conversation timeline, featuring session management, event inspection, and performance metrics.

## Log Format
The visualizer parses line-delimited logs in the following format:
```
{ISO_TIMESTAMP} [{SESSION_ID}] [{SOURCE}] {JSON_PAYLOAD}
```
- **Timestamp**: ISO 8601
- **Session ID**: Distinct session identifier
- **Source**: `[OPENAI]` or `[USER]`
- **Payload**: Valid JSON event object

**Example:**
```log
2024-03-20T10:00:00.000Z [sess_abc123] [OPENAI] {"type":"session.created",...}
```

## Usage
Simply drag and drop your `.log` file onto the window, or paste the log content directly to visualize it.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
