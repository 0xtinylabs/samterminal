package database

import (
	"testing"
	"tokendata/env"
)

func TestConnectToDataBase(t *testing.T) {
	env.LoadEnv(".env")
	CreateClient()
	result := ConnectToDB()
	defer DisconnectFromDB()
	if !result {
		t.Errorf("Connection failed")
	}
}
