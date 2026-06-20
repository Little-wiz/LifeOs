// src/ai/mockAnthropic.js
//
// A stand-in for the real Anthropic client, used while developing
// without spending real API credits. It looks at the user's message,
// picks a sensible canned response (sometimes using a tool, sometimes
// just replying), and returns it in the exact same shape the real
// Claude API would.
//
// Switch back to the real API any time by setting USE_MOCK_AI=false
// in your .env file. No code changes needed.

function makeTextResponse(text) {
  return {
    stop_reason: "end_turn",
    content: [{ type: "text", text }],
  };
}

function makeToolUseResponse(toolName, input, id = `mock_tool_${Date.now()}`) {
  return {
    stop_reason: "tool_use",
    content: [
      {
        type: "tool_use",
        id,
        name: toolName,
        input,
      },
    ],
  };
}

function pickMockResponse(latestUserMessage, hasGoals) {
  const msg = (latestUserMessage || "").toLowerCase();

  if (
    !hasGoals &&
    (msg.includes("want to") || msg.includes("i'm trying to") || msg.includes("goal"))
  ) {
    return makeToolUseResponse("create_goal", {
      title: "Land a machine learning internship",
      category: "Career",
      targetDate: "2026-09-01",
      milestones: [
        { title: "Complete ML fundamentals course", dueDate: "2026-07-05" },
        { title: "Build first portfolio project", dueDate: "2026-07-20" },
        { title: "Build second portfolio project", dueDate: "2026-08-05" },
        { title: "Apply to 10 internships", dueDate: "2026-08-20" },
        { title: "Prepare for technical interviews", dueDate: "2026-08-30" },
      ],
    });
  }

  if (msg.includes("finished") || msg.includes("completed") || msg.includes("done with")) {
    return makeToolUseResponse("update_milestone", {
      goalId: "MOCK_GOAL_ID",
      milestoneTitle: "Complete ML fundamentals course",
      status: "done",
    });
  }

  if (msg.includes("internship") && (msg.includes("applying") || msg.includes("found"))) {
    return makeToolUseResponse("add_opportunity", {
      goalId: "MOCK_GOAL_ID",
      name: "Google STEP Internship 2026",
      deadline: "2026-09-15",
    });
  }

  return makeTextResponse(
    "Got it! (This is a mock response — real AI calls are turned off right now " +
      "to save API credits during development. Set USE_MOCK_AI=false in your " +
      ".env to use the real Claude API.)"
  );
}

function pickMockFollowUp(toolResultText) {
  return makeTextResponse(
    `Done — ${toolResultText} (mock response, no real API call was made)`
  );
}

export const mockAnthropic = {
  messages: {
    async create({ messages, system }) {
      const lastMessage = messages[messages.length - 1];

      const isToolResultFollowUp =
        Array.isArray(lastMessage.content) &&
        lastMessage.content[0]?.type === "tool_result";

      if (isToolResultFollowUp) {
        const resultText = lastMessage.content[0].content;
        return pickMockFollowUp(resultText);
      }

      const latestUserMessage =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : lastMessage.content?.[0]?.text || "";

      const hasGoals = system?.includes("current goals") && !system?.includes("no goals yet");

      return pickMockResponse(latestUserMessage, hasGoals);
    },
  },
};