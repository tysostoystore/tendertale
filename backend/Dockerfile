FROM golang:1.24-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy necessary directories
COPY --from=builder /app/scenes ./scenes
COPY --from=builder /app/saves ./saves
COPY --from=builder /app/models ./models
COPY --from=builder /app/handlers ./handlers

# Expose port
EXPOSE 8080

# Run the application :)
CMD ["./main"] 