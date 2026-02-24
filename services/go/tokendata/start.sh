#!/bin/bash

go run github.com/steebchen/prisma-client-go migrate dev

go build -o app .

exec "$@"