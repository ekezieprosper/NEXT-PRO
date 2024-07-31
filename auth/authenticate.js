const agentModel = require("../models/agentModel")
const playerModel = require("../models/playerModel")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const authenticate = async (req, res, next) => {
  try {
    const hasAuthorization = req.headers.authorization

    if (!hasAuthorization) {
      return res.status(401).json({
        error: "Authorization header not found",
      })
    }

    const token = hasAuthorization.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        error: "Token not found",
      })
    }

    const decodedToken = jwt.verify(token, process.env.jwtkey)

    const user = await agentModel.findById(decodedToken.userId) || await playerModel.findById(decodedToken.userId)

    if (!user) {
      return res.status(404).json({
        error: "Unauthorized",
      })
    }   

    req.user = decodedToken
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
  
      return res.status(401).json({
        error:  `Expired session. Login`,
      })
    }

    res.status(500).json({
      error: error.message,
    })
  }
}

module.exports = authenticate
