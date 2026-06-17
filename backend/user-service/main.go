package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type User struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

var db *sql.DB

func connectDB() {
	connStr := "host=postgres user=postgres password=postgres dbname=telkantin port=5432 sslmode=disable"

	var err error

	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("PostgreSQL Connected")
}

func createUser(c *gin.Context) {
	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	var id int

	err := db.QueryRow(
		`INSERT INTO users (full_name, email, password, role)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id`,
		user.FullName,
		user.Email,
		user.Password,
		user.Role,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created",
		"id":      id,
	})
}

func getUsers(c *gin.Context) {
	rows, err := db.Query(
		"SELECT id, full_name, email, password, role FROM users",
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	defer rows.Close()

	var users []User

	for rows.Next() {
		var user User

		err := rows.Scan(
			&user.ID,
			&user.FullName,
			&user.Email,
			&user.Password,
			&user.Role,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func getUserByID(c *gin.Context) {
	id := c.Param("id")

	var user User

	err := db.QueryRow(
		`SELECT id, full_name, email, password, role
		 FROM users
		 WHERE id = $1`,
		id,
	).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.Password,
		&user.Role,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

func updateUser(c *gin.Context) {
	id := c.Param("id")

	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	_, err := db.Exec(
		`UPDATE users
		 SET full_name = $1,
		     email = $2,
		     password = $3,
		     role = $4
		 WHERE id = $5`,
		user.FullName,
		user.Email,
		user.Password,
		user.Role,
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated",
	})
}

func deleteUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec(
		"DELETE FROM users WHERE id = $1",
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted",
	})
}

func main() {
	connectDB()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "user-service",
			"status":  "running",
		})
	})

	r.GET("/users", getUsers)
	r.GET("/users/:id", getUserByID)
	r.POST("/users", createUser)
	r.PUT("/users/:id", updateUser)
	r.DELETE("/users/:id", deleteUser)

	log.Println("User Service running on port 3000")
	r.Run(":3000")
}