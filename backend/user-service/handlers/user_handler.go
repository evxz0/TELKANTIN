package handlers

import (
	"net/http"
	"strconv"

	"user-service/config"
	"user-service/models"

	"github.com/gin-gonic/gin"
)

func CreateUser(c *gin.Context) {

	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	query := `
		INSERT INTO users
		(full_name, email, password, role)
		VALUES (?, ?, ?, ?)
	`

	result, err := config.DB.Exec(
		query,
		user.FullName,
		user.Email,
		user.Password,
		user.Role,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	id, _ := result.LastInsertId()

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created",
		"id":      id,
	})
}

func GetUsers(c *gin.Context) {

	rows, err := config.DB.Query(
		"SELECT id, full_name, email, password, role FROM users",
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	defer rows.Close()

	var users []models.User

	for rows.Next() {

		var user models.User

		rows.Scan(
			&user.ID,
			&user.FullName,
			&user.Email,
			&user.Password,
			&user.Role,
		)

		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func GetUserByID(c *gin.Context) {

	id := c.Param("id")

	var user models.User

	err := config.DB.QueryRow(
		"SELECT id, full_name, email, password, role FROM users WHERE id = ?",
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

func UpdateUser(c *gin.Context) {

	id := c.Param("id")

	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	_, err := config.DB.Exec(
		`UPDATE users
		SET full_name=?, email=?, password=?, role=?
		WHERE id=?`,
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

func DeleteUser(c *gin.Context) {

	id, _ := strconv.Atoi(c.Param("id"))

	_, err := config.DB.Exec(
		"DELETE FROM users WHERE id=?",
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