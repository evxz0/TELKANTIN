FROM golang:1.24-alpine

WORKDIR /app

COPY . .

RUN sed -i 's/1.25.0/1.24.0/g' go.mod vendor/modules.txt || true

RUN go build -mod=vendor -o main .

EXPOSE 3000

CMD ["./main"]