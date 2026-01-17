import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  parseLogFile,
  buildConversationItems,
  getUniqueSessions,
  filterBySession,
  extractSessionData,
  toParsedEvent,
} from '@/lib/log-parser';

// Default log file location (in project root)
const LOG_DIR = process.cwd();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get('file');
  const sessionId = searchParams.get('session');

  try {
    // If no file specified, list available log files
    if (!fileName) {
      const files = await fs.readdir(LOG_DIR);
      const logFiles = files.filter(f => f.endsWith('.log'));

      return NextResponse.json({
        success: true,
        files: logFiles,
      });
    }

    // Read and parse the specified log file
    const filePath = path.join(LOG_DIR, fileName);

    // Security check: ensure file is in allowed directory
    if (!filePath.startsWith(LOG_DIR)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse log file
    let rawLines = parseLogFile(content);

    // Get unique sessions
    const sessions = getUniqueSessions(rawLines);

    // Filter by session if specified
    if (sessionId) {
      rawLines = filterBySession(rawLines, sessionId);
    }

    // Build conversation items
    const conversationItems = buildConversationItems(rawLines);

    // Extract session data
    const parsedEvents = rawLines.map(toParsedEvent);
    const sessionData = extractSessionData(parsedEvents);

    return NextResponse.json({
      success: true,
      fileName,
      totalEvents: rawLines.length,
      sessions,
      currentSession: sessionId || sessions[0] || null,
      sessionData,
      conversationItems,
      // Also include raw events for Inspector
      rawEvents: parsedEvents,
    });
  } catch (error) {
    console.error('Error processing log file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
