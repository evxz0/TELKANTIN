package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

// ── Model ───────────────────────────────────────────────────────────────

type User struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// ── Database ────────────────────────────────────────────────────────────

var db *sql.DB

func connectDB() {
	dsn := "root:rootpassword@tcp(mysql:3306)/telkantin"
	var err error

	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("Database Connected")
}

// ── Handlers ────────────────────────────────────────────────────────────

func createUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := db.Exec(
		"INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
		user.FullName, user.Email, user.Password, user.Role,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "User created", "id": id})
}

func getUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, full_name, email, password, role FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		rows.Scan(&user.ID, &user.FullName, &user.Email, &user.Password, &user.Role)
		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func getUserByID(c *gin.Context) {
	id := c.Param("id")
	var user User

	err := db.QueryRow(
		"SELECT id, full_name, email, password, role FROM users WHERE id = ?", id,
	).Scan(&user.ID, &user.FullName, &user.Email, &user.Password, &user.Role)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func updateUser(c *gin.Context) {
	id := c.Param("id")
	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.Exec(
		"UPDATE users SET full_name=?, email=?, password=?, role=? WHERE id=?",
		user.FullName, user.Email, user.Password, user.Role, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated"})
}

func deleteUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec("DELETE FROM users WHERE id=?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// ── Main ────────────────────────────────────────────────────────────────

func main() {
	connectDB()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"service": "user-service", "status": "running"})
	})

	r.GET("/users", getUsers)
	r.GET("/users/:id", getUserByID)
	r.POST("/users", createUser)
	r.PUT("/users/:id", updateUser)
	r.DELETE("/users/:id", deleteUser)

	r.Run(":3000")
}