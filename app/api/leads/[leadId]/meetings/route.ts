import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { resolveAuthenticatedUser } from "@/app/api/_utils/auth";
import {
  isCalendarConfigured,
  upsertCalendarEvent,
} from "@/lib/googleCalendar";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const DEFAULT_TIMEZONE = process.env.MEETINGS_TIMEZONE ?? "Asia/Kolkata";

type MeetingPayload = {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  timeZone?: string;
};

type CalendarAttendee = {
  email: string;
  displayName?: string | null;
};

function normalizeTimeLabel(label: string): string {
  const trimmed = label.trim();

  return trimmed.toUpperCase().replace(/\s+/g, " ");
}

function parse12HourTime(time: string): string | null {
  const normalized = normalizeTimeLabel(time);
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) return null;

  if (period === "AM") {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  const hoursString = hours.toString().padStart(2, "0");
  const minutesString = minutes.toString().padStart(2, "0");

  return `${hoursString}:${minutesString}`;
}

function buildDateTime(date: string, time24: string): string {
  return `${date}T${time24}:00`;
}

function ensureValidDate(date: string): boolean {
  const match = date.match(/^\d{4}-\d{2}-\d{2}$/);

  if (!match) return false;

  const asDate = new Date(date + "T00:00:00");

  return !Number.isNaN(asDate.getTime());
}

function isStartBeforeEnd(start: string, end: string): boolean {
  return start < end;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const auth = await resolveAuthenticatedUser(req);

  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured." },
      { status: 500 },
    );
  }

  const { leadId } = await params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Lead identifier is required." },
      { status: 400 },
    );
  }

  const payload = (await req.json().catch(() => ({}))) as MeetingPayload;

  const title = payload.title?.toString().trim();
  const date = payload.date?.toString().trim();
  const startLabel = payload.startTime?.toString().trim();
  const endLabel = payload.endTime?.toString().trim();
  const location = payload.location?.toString().trim() ?? "";
  const description = payload.description?.toString().trim() ?? "";
  const timeZone = payload.timeZone?.toString().trim() || DEFAULT_TIMEZONE;

  if (!title) {
    return NextResponse.json(
      { error: "Meeting title is required." },
      { status: 400 },
    );
  }

  if (!date || !ensureValidDate(date)) {
    return NextResponse.json(
      { error: "A valid meeting date (YYYY-MM-DD) is required." },
      { status: 400 },
    );
  }

  if (!startLabel || !endLabel) {
    return NextResponse.json(
      { error: "Start and end times in 12-hour format are required." },
      { status: 400 },
    );
  }

  const startTime24 = parse12HourTime(startLabel);
  const endTime24 = parse12HourTime(endLabel);

  if (!startTime24 || !endTime24) {
    return NextResponse.json(
      { error: "Time values must be in the format HH:MM AM/PM." },
      { status: 400 },
    );
  }

  if (!isStartBeforeEnd(startTime24, endTime24)) {
    return NextResponse.json(
      { error: "End time must be later than start time." },
      { status: 400 },
    );
  }

  const leadFilter: Record<string, unknown> = {};

  // Only filter by assignedTo if the user is not an admin
  if (auth.role !== "admin") {
    leadFilter.assignedTo = auth.email;
  }

  if (ObjectId.isValid(leadId)) {
    leadFilter._id = new ObjectId(leadId);
  } else {
    leadFilter._id = leadId;
  }

  const leadsCollection = auth.db.collection("leads");

  const leadDoc = await leadsCollection.findOne(leadFilter, {
    projection: { email: 1, name: 1 },
  });

  if (!leadDoc) {
    return NextResponse.json(
      { error: "Lead not found for the current user." },
      { status: 404 },
    );
  }

  const attendees: CalendarAttendee[] = [{ email: auth.email }];

  const leadEmail = typeof leadDoc.email === "string" ? leadDoc.email : null;
  const leadName = typeof leadDoc.name === "string" ? leadDoc.name : undefined;

  if (
    leadEmail &&
    !attendees.some((attendee) => attendee.email === leadEmail)
  ) {
    attendees.push({ email: leadEmail, displayName: leadName });
  }

  const startDateTime = buildDateTime(date, startTime24);
  const endDateTime = buildDateTime(date, endTime24);

  const event = await upsertCalendarEvent({
    summary: title,
    description,
    location,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    attendees,
  });

  if (!event || !event.id) {
    return NextResponse.json(
      { error: "Failed to create Google Calendar event." },
      { status: 500 },
    );
  }

  const meetingId = new ObjectId();
  const now = new Date();

  const meetingRecord = {
    _id: meetingId,
    title,
    date,
    startTimeLabel: normalizeTimeLabel(startLabel),
    endTimeLabel: normalizeTimeLabel(endLabel),
    startDateTime,
    endDateTime,
    timeZone,
    location,
    description,
    attendees: attendees.map((attendee) => attendee.email),
    googleEventId: event.id,
    hangoutLink: event.hangoutLink ?? null,
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
    createdBy: auth.email,
  };

  const updateResult = await leadsCollection.findOneAndUpdate(
    leadFilter,
    {
      $push: { meetings: meetingRecord as any },
      $set: { updatedAt: now },
    },
    {
      upsert: false,
      returnDocument: "after",
    },
  );

  if (!updateResult || !updateResult.value) {
    return NextResponse.json(
      { error: "Failed to persist meeting to lead document." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      meeting: meetingRecord,
      meetings: updateResult.value.meetings ?? [meetingRecord],
    },
    { status: 201 },
  );
}
