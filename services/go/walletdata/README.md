# Scanner Wallet

Scanner ( DEX ) wallet microservice

### Tasks

- Taskfile.yml
    - proto:gen -> Genearates go declarations from proto file(s)
    - start -> Start's the go application
    - test-all -> Runs all _test.go files and gives the results. ( COVERAGE )

### Tech Stack

- Programming Language -> GO
- ORM -> Prisma
- DB -> Neon (Postgresql)

### Frameworks

- Microservice -> gRPC



### Starting The Application

```sh
go mod tidy
task start
```


