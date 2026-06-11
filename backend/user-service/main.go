package main

import (
	"user-service/config"
	"user-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {

	config.ConnectDB()

	r := gin.Default()

	routes.SetupRoutes(r)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "user-service",
			"status": "running",
		})
	})

	r.Run(":3000")
}