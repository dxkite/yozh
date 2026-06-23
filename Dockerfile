FROM golang:1.25-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o astro-runtime ./cmd

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/astro-runtime .
EXPOSE 8080
ENTRYPOINT ["./astro-runtime", "serve"]
CMD ["--pack", "/data/bundle.pack", "--port", "8080", "--cache-dir", "/cache"]
