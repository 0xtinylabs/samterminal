package db_dto

import proto "tokendata/proto/token"

type ResponseType struct {
	Success      bool
	Message      string
	AddingType   *proto.TokenAddingType
	RemovingType *proto.TokenRemovingType
}

type TokenAddress string
