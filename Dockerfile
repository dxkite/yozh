FROM golang:1.25-alpine AS builder
WORKDIR /build

ENV GOPROXY=https://goproxy.cn,direct
ENV GONOSUMCHECK=*

COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o yozh ./cmd

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/yozh .
EXPOSE 8080
ENTRYPOINT ["./yozh", "serve"]
CMD ["--pack", "/data/bundle.pack", "--port", "8080", "--cache-dir", "/cache"]
