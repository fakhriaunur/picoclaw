import { toast } from "sonner"

import { normalizeUnixTimestamp } from "@/features/chat/state"
import { type ToolCall, updateChatStore } from "@/store/chat"

export interface PicoMessage {
  type: string
  id?: string
  session_id?: string
  timestamp?: number | string
  payload?: Record<string, unknown>
}

export function handlePicoMessage(
  message: PicoMessage,
  expectedSessionId: string,
) {
  if (message.session_id && message.session_id !== expectedSessionId) {
    return
  }

  const payload = message.payload || {}

  switch (message.type) {
    case "message.create": {
      const content = (payload.content as string) || ""
      const messageId = (payload.message_id as string) || `pico-${Date.now()}`
      const timestamp =
        message.timestamp !== undefined &&
        Number.isFinite(Number(message.timestamp))
          ? normalizeUnixTimestamp(Number(message.timestamp))
          : Date.now()

      let toolCalls: ToolCall[] | undefined
      const rawToolCalls = payload.tool_calls
      if (Array.isArray(rawToolCalls)) {
        toolCalls = rawToolCalls
          .map((tc: Record<string, unknown>) => {
            const fn = tc.function as Record<string, unknown> | undefined
            if (!fn || typeof fn.name !== "string") return null
            return {
              id: (tc.id as string) || "",
              name: fn.name,
              arguments:
                typeof fn.arguments === "string"
                  ? fn.arguments
                  : JSON.stringify(fn.arguments ?? {}),
            }
          })
          .filter((tc: ToolCall | null): tc is ToolCall => tc !== null)
        if (toolCalls.length === 0) {
          toolCalls = undefined
        }
      }

      updateChatStore((prev) => ({
        messages: [
          ...prev.messages,
          {
            id: messageId,
            role: "assistant",
            content,
            timestamp,
            tool_calls: toolCalls,
          },
        ],
        isTyping: false,
      }))
      break
    }

    case "message.update": {
      const content = (payload.content as string) || ""
      const messageId = payload.message_id as string
      if (!messageId) {
        break
      }

      let toolCalls: ToolCall[] | undefined
      const rawToolCalls = payload.tool_calls
      if (Array.isArray(rawToolCalls)) {
        toolCalls = rawToolCalls
          .map((tc: Record<string, unknown>) => {
            const fn = tc.function as Record<string, unknown> | undefined
            if (!fn || typeof fn.name !== "string") return null
            return {
              id: (tc.id as string) || "",
              name: fn.name,
              arguments:
                typeof fn.arguments === "string"
                  ? fn.arguments
                  : JSON.stringify(fn.arguments ?? {}),
            }
          })
          .filter((tc: ToolCall | null): tc is ToolCall => tc !== null)
        if (toolCalls.length === 0) {
          toolCalls = undefined
        }
      }

      updateChatStore((prev) => ({
        messages: prev.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, content, tool_calls: toolCalls }
            : msg,
        ),
      }))
      break
    }

    case "typing.start":
      updateChatStore({ isTyping: true })
      break

    case "typing.stop":
      updateChatStore({ isTyping: false })
      break

    case "error": {
      const requestId =
        typeof payload.request_id === "string" ? payload.request_id : ""
      const errorMessage =
        typeof payload.message === "string" ? payload.message : ""

      console.error("Pico error:", payload)
      if (errorMessage) {
        toast.error(errorMessage)
      }
      updateChatStore((prev) => ({
        messages: requestId
          ? prev.messages.filter((msg) => msg.id !== requestId)
          : prev.messages,
        isTyping: false,
      }))
      break
    }

    case "pong":
      break

    default:
      console.log("Unknown pico message type:", message.type)
  }
}
