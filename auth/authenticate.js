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

    const decodedToken = jwt.verify(token, process.env.jwtkey, (error,payload)=>{
            if(error){
              return error
            }
            return payload
        });

        if(decodedToken.name === "TokenExpiredError"){
            return res.status(400).json({
                error:"user logged Out... please login to continue"
            })
        }else if(decodedToken.name === "JsonWebTokenError"){
            return res.status(400).json({
                error:"Invalid Token"
            })
        }else if(decodedToken.name === "NotBeforeError"){
            return res.status(400).json({
                error:"Token not active"
            })
        }

    const user = await agentModel.findById(decodedToken.userId) || await playerModel.findById(decodedToken.userId)
    if (!user) {
      return res.status(404).json({
        error: "Unauthorized",
      })
    }   

    req.user = decodedToken
    next()
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
}

module.exports = authenticate