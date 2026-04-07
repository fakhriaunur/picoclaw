package commands

import "context"

func stopCommand() Definition {
	return Definition{
		Name:        "stop",
		Description: "Stop the current running task",
		Usage:       "/stop",
		Aliases:     []string{"cancel"},
		Handler: func(_ context.Context, req Request, rt *Runtime) error {
			if rt == nil || rt.StopTurn == nil {
				return req.Reply(unavailableMsg)
			}
			if rt.StopTurn() {
				return req.Reply("Task stopped.")
			}
			return req.Reply("No active task to stop.")
		},
	}
}
