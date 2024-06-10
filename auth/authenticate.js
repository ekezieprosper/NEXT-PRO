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

    let user = await agentModel.findById(decodedToken.userId)
    if (!user) {
      user = await playerModel.findById(decodedToken.userId)
    }

    if (!user) {
      return res.status(404).json({
        error: "Unauthorized",
      })
    }

    const timeCreated = new Date(user.time)
    const logoutTime = new Date(timeCreated.getTime() + 30 * 24 * 60 * 60 * 1000)
    const currentTime = new Date()

    if (currentTime > logoutTime) {
      await agentModel.findByIdAndUpdate(user._id,{tokens:null}) ||
     await playerModel.findByIdAndUpdate(user._id,{tokens:null})
     
      return res.status(400).json({
        error: `Session expired. Login to ${user.userName}`,
      })
    }

    if (!user.tokens) {
      return res.status(401).json({
        error: `Session expired. Login to ${user.userName}`,
      })
    }

    req.user = decodedToken
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Expired token",
      })
    }

    res.status(500).json({
      error: error.message,
    })
  }
}

module.exports = authenticate
