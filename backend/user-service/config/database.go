package config

import (
	"database/sql"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB() {

	dsn := "root:rootpassword@tcp(mysql:3306)/telkantin"

	var err error

	DB, err = sql.Open("mysql", dsn)

	if err != nil {
		log.Fatal(err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("Database Connected")
}