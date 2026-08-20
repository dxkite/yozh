package yozh

import (
	"time"

	"github.com/dxkite/yozh/trace"
)

// signalKind tags each ResponseSignal to distinguish header, chunk, done, and error events.
type signalKind uint8

const (
	sigHeader signalKind = iota // JS sent response headers; handler writes status + headers
	sigChunk                    // JS produced a body chunk; handler writes and flushes it
	sigDone                     // body fully consumed; handler records trace and returns
	sigError                    // eval error; handler sends 5xx
)

// responseMeta holds the status code and serialized headers from a JS response.
type responseMeta struct {
	Status      int
	HeadersJSON string
}

// ResponseSignal carries streaming events from the JS goroutine to HandleSSR.
// One sigHeader is sent first, then zero or more sigChunk signals, then sigDone.
// sigError may be sent at any point if the JS eval fails.
type ResponseSignal struct {
	Kind          signalKind
	Meta          responseMeta         // sigHeader
	Chunk         []byte               // sigChunk
	Err           error                // sigError
	JSCheckpoints []trace.JSCheckpoint // sigDone
	BodyTime      time.Time            // sigHeader: time.Now() when headers are ready
}
