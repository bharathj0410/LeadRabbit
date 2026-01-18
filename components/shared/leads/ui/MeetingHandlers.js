// Common meeting handlers for both admin and user components
export const createMeetingHandlers = (
  normalizedLeadId,
  meetings,
  propagateMeetings,
  setMeetingActionState,
  handleMeetingActionError,
) => {
  const handleCreateMeeting = async (payload) => {
    if (!normalizedLeadId)
      return { success: false, error: "Missing lead identifier." };

    setMeetingActionState({ submitting: true, error: null });

    try {
      // Try API first, fallback to local if Google Calendar not configured
      try {
        const response = await fetch(
          `/api/leads/${normalizedLeadId}/meetings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include", // Include cookies for authentication
          },
        );

        const result = await response.json();

        if (response.ok) {
          // API success - update local state
          if (result.meeting) {
            const updatedMeetings = [...meetings, result.meeting];
            propagateMeetings(updatedMeetings);
          }
          setMeetingActionState({ submitting: false, error: null });
          return { success: true, isGoogleCalendar: true };
        } else if (
          result.error &&
          result.error.includes("Google Calendar is not configured")
        ) {
          // Google Calendar not configured - fallback to local storage
          console.warn(
            "Google Calendar not configured, creating meeting locally",
          );

          const newMeeting = {
            _id: Date.now().toString(),
            ...payload,
            status: "scheduled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            localOnly: true, // Flag to indicate this is local-only
          };

          const updatedMeetings = [...meetings, newMeeting];
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true, isLocalOnly: true };
        } else {
          throw new Error(result.error || "Failed to create meeting");
        }
      } catch (fetchError) {
        // If it's a Google Calendar configuration error, fallback to local
        if (
          fetchError.message &&
          fetchError.message.includes("Google Calendar is not configured")
        ) {
          console.warn(
            "Google Calendar not configured, creating meeting locally",
          );

          const newMeeting = {
            _id: Date.now().toString(),
            ...payload,
            status: "scheduled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            localOnly: true, // Flag to indicate this is local-only
          };

          const updatedMeetings = [...meetings, newMeeting];
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true, isLocalOnly: true };
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Failed to create meeting", error);
      const message =
        error.message || "Unable to create meeting. Please try again.";
      handleMeetingActionError(message);
      return { success: false, error: message };
    }
  };

  const handleRescheduleMeeting = async (meetingId, payload) => {
    if (!normalizedLeadId)
      return { success: false, error: "Missing lead identifier." };

    setMeetingActionState({ submitting: true, error: null });

    try {
      // Try API first, fallback to local if Google Calendar not configured
      try {
        const response = await fetch(
          `/api/leads/${normalizedLeadId}/meetings/${meetingId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include", // Include cookies for authentication
          },
        );

        const result = await response.json();

        if (response.ok) {
          // API success - update local state
          if (result.meetings) {
            propagateMeetings(result.meetings);
          }
          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else if (
          result.error &&
          result.error.includes("Google Calendar is not configured")
        ) {
          // Google Calendar not configured - fallback to local update
          console.warn(
            "Google Calendar not configured, updating meeting locally",
          );

          const updatedMeetings = meetings.map((meeting) =>
            meeting._id === meetingId
              ? {
                  ...meeting,
                  ...payload,
                  updatedAt: new Date().toISOString(),
                  localOnly: true, // Flag to indicate this is local-only
                }
              : meeting,
          );
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else {
          throw new Error(result.error || "Failed to reschedule meeting");
        }
      } catch (fetchError) {
        // If it's a Google Calendar configuration error, fallback to local
        if (
          fetchError.message &&
          fetchError.message.includes("Google Calendar is not configured")
        ) {
          console.warn(
            "Google Calendar not configured, updating meeting locally",
          );

          const updatedMeetings = meetings.map((meeting) =>
            meeting._id === meetingId
              ? {
                  ...meeting,
                  ...payload,
                  updatedAt: new Date().toISOString(),
                  localOnly: true, // Flag to indicate this is local-only
                }
              : meeting,
          );
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Failed to reschedule meeting", error);
      const message =
        error.message || "Unable to reschedule meeting. Please try again.";
      handleMeetingActionError(message);
      return { success: false, error: message };
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!normalizedLeadId)
      return { success: false, error: "Missing lead identifier." };

    setMeetingActionState({ submitting: true, error: null });

    try {
      // Try API first, fallback to local if Google Calendar not configured
      try {
        const response = await fetch(
          `/api/leads/${normalizedLeadId}/meetings/${meetingId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies for authentication
          },
        );

        const result = await response.json();

        if (response.ok) {
          // API success - update local state
          if (result.meetings) {
            propagateMeetings(result.meetings);
          }
          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else if (
          result.error &&
          result.error.includes("Google Calendar is not configured")
        ) {
          // Google Calendar not configured - fallback to local removal
          console.warn(
            "Google Calendar not configured, removing meeting locally",
          );

          const updatedMeetings = meetings.filter(
            (meeting) => meeting._id !== meetingId,
          );
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else {
          throw new Error(result.error || "Failed to cancel meeting");
        }
      } catch (fetchError) {
        // If it's a Google Calendar configuration error, fallback to local
        if (
          fetchError.message &&
          fetchError.message.includes("Google Calendar is not configured")
        ) {
          console.warn(
            "Google Calendar not configured, removing meeting locally",
          );

          const updatedMeetings = meetings.filter(
            (meeting) => meeting._id !== meetingId,
          );
          propagateMeetings(updatedMeetings);

          setMeetingActionState({ submitting: false, error: null });
          return { success: true };
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Failed to cancel meeting", error);
      const message =
        error.message || "Unable to cancel meeting. Please try again.";
      handleMeetingActionError(message);
      return { success: false, error: message };
    }
  };

  return {
    handleCreateMeeting,
    handleRescheduleMeeting,
    handleCancelMeeting,
  };
};
