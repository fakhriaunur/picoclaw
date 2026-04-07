import { IconCheck, IconCopy, IconWrench } from "@tabler/icons-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { formatMessageTime } from "@/hooks/use-pico-chat"
import type { ToolCall } from "@/store/chat"

interface AssistantMessageProps {
  content: string
  timestamp?: string | number
  tool_calls?: ToolCall[]
}

function parseArguments(raw: string): string | null {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return null
  }
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const formattedArgs = parseArguments(toolCall.arguments)

  return (
    <div className="border-border/50 bg-muted/30 rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <IconWrench className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        <span className="font-mono text-sm font-medium">{toolCall.name}</span>
        <span className="text-muted-foreground ml-auto text-xs">
          {expanded ? "Hide" : "Show"} args
        </span>
      </button>
      {expanded && formattedArgs && (
        <div className="border-border/50 border-t px-3 py-2">
          <pre className="text-muted-foreground overflow-x-auto text-xs">
            {formattedArgs}
          </pre>
        </div>
      )}
    </div>
  )
}

export function AssistantMessage({
  content,
  timestamp = "",
  tool_calls,
}: AssistantMessageProps) {
  const [isCopied, setIsCopied] = useState(false)
  const formattedTimestamp =
    timestamp !== "" ? formatMessageTime(timestamp) : ""

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <div className="group flex w-full flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center justify-between gap-2 px-1 text-xs opacity-70">
        <div className="flex items-center gap-2">
          <span>PicoClaw</span>
          {formattedTimestamp && (
            <>
              <span className="opacity-50">•</span>
              <span>{formattedTimestamp}</span>
            </>
          )}
        </div>
      </div>

      {tool_calls && tool_calls.length > 0 && (
        <div className="flex flex-col gap-2">
          {tool_calls.map((tc) => (
            <ToolCallItem key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}

      {content && (
        <div className="bg-card text-card-foreground relative overflow-hidden rounded-xl border">
          <div className="prose dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:bg-zinc-950 prose-pre:p-3 max-w-none p-4 text-[15px] leading-relaxed [overflow-wrap:anywhere] break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {content}
            </ReactMarkdown>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/50 hover:bg-background/80 absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopy}
          >
            {isCopied ? (
              <IconCheck className="h-4 w-4 text-green-500" />
            ) : (
              <IconCopy className="text-muted-foreground h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
