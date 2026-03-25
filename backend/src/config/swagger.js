const swaggerJSDoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HealthLog API',
      version: '1.0.0',
      description: 'API для застосунку супроводу здорового способу життя.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
}

const swaggerSpec = swaggerJSDoc(options)

module.exports = swaggerSpec