import { useEffect } from 'react';

export const useNovaEvents = (userId, onDraftCreated) => {
  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${import.meta.env.VITE_BACKEND_API_URI}/api/tasks/events?userId=${userId}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Received event:", data);
        
        if (data.type === "TASK_DRAFT_CREATED") {
          if (onDraftCreated) onDraftCreated(data.draftId);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
      eventSource.close();
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [userId]);
};
