const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const adminModel = require("../models/adminModel")
const notificationModel = require("../models/notificationModel")
const OTPModel = require('../models/otpModel')
const cloudinary = require("../media/cloudinary")
const parsePhoneNumber = require('libphonenumber-js')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fs = require("fs")
require("dotenv").config()
const sendOtp = require("../Emails/sendOTPcode")
const sendEmail = require("../Emails/email")
const { resetFunc } = require("../Emails/resetPasswordEmail")
const resendOtpEmail = require("../Emails/resendOTP")


exports.home = (req, res) => {
    res.send("<h1>....Connecting players to the real world of football.</h1>")
}


exports.signupPlayer = async (req, res) => {
    try {
        // Required information for registration
        const { userName, password, gender, position, subPosition, email, country } = req.body

        if (!country) {
            return res.status(400).json({
                error: 'country is required.'
            })
        }

         // Check if position and subPosition are provided
         if (!position || !subPosition) {
            return res.status(400).json({
                error: 'Both position and subPosition are required.'
            })
        }

        // Check if the subPosition is valid for the given position
        const positionSubpositionMap = {
            'Striker': ['ST', 'SS', 'RW', 'LW'],
            'Midfielder': ['CAM', 'CDM', 'CM', 'RM', 'LM'],
            'Defender': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
            'Goalkeeper': ['GK']
        }

        if (!positionSubpositionMap[position]?.includes(subPosition)) {
            return res.status(400).json({
                error: `${subPosition} is not a valid subposition for the selected position (${position}).`
            })
        }

        // Check if the email already exists in the agent database
        const Email = await agentModel.findOne({ email })
        if (Email) {
            return res.status(403).json({
                error: `${email} can not be used for signup as a player`
            })
        }

        // Check if user already exists in the database
        const searchUsername = await agentModel.findOne({userName}) || await playerModel.findOne({userName})
        // Throw an error if user was found
        if (searchUsername) {
            return res.status(403).json({
                error: `${userName} is taken.`
            })
        }

        // Encrypt player password
        const saltpass = bcrypt.genSaltSync(10)
        const hashpass = bcrypt.hashSync(password, saltpass)

        // Create an instance of a player
        const player = await playerModel.create({
            userName: userName.toLowerCase(),
            password: hashpass,
            country,
            gender,
            position,
            subPosition,
            email: email.toLowerCase(),
        })

        // Error message if player was unable to register
        if (!player) {
            return res.status(400).json({
                error: "an error occured while creating this account"
            })
        } else {
            // Generate 6-digit OTP
            const otp = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')

            // Pass player information to sendOtp
            await sendOtp(null, player, otp)

            // Send an OTP to the player's email
            res.status(201).json({
                message: `an otp code has been sent to your email for verification`,
                userName: player.userName,
                id: player._id
            })
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.signupAgent = async (req, res) => {
    try {
        // required information for registration
        const { userName, password, gender, email, country } = req.body

        if (!country) {
            return res.status(400).json({
                error: 'country is required.'
            })
        }

        // Check if the email exists in the player's database
        const Email = await playerModel.findOne({ email })
        if (Email) {
            return res.status(403).json({
                error: `${email} can not be used for signup as an agent`
            })
        }

        // check if user already exists in the database
        const searchUsername = await agentModel.findOne({ userName }) || await playerModel.findOne({ userName })
        // throw an error if user was found
        if (searchUsername) {
            return res.status(403).json({
                error: `${userName} is taken`
            })
        }

        // encrypt agent password
        const saltpass = bcrypt.genSaltSync(10)
        const hashpass = bcrypt.hashSync(password, saltpass)

        // create an instance of an agent
        const agent = await agentModel.create({
            userName: userName.toLowerCase(),
            country,
            password: hashpass,
            gender,
            email: email.toLowerCase(),
        })

        if (!agent) {
            return res.status(400).json({
                error: "an error occured while creating this account"
            })
        } else {
            // Generate 6-digit OTP
            const otp = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')

            // Pass agent information to sendOtp
            await sendOtp(agent, null, otp)

            // send an otp to the agent email
            res.status(201).json({
                message: `an otp code has been sent to your email for verification`,
                userName: agent.userName,
                id: agent._id
            })
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.resendOTP = async (req, res) => {
    try {
        const id = req.params.id

        const agent = await agentModel.findById(id)
        const player = await playerModel.findById(id)
        const user = player || agent
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Generate 6-digit OTP
        const otp = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')

        // hash OTP then save it to the database
        const saltotp = bcrypt.genSaltSync(10)
        const hashotp = bcrypt.hashSync(otp, saltotp)

        // Save the hashed OTP in the OTPModel for verification
        await OTPModel.create({
            agentId: agent ? agent._id : undefined,
            playerId: player ? player._id : undefined,
            otp: hashotp
        })

        // Send the OTP to the user's email
        const subject =   `${otp} is your verification code`
        const verificationLink = `https://pronext.onrender.com/verify/${agent?._id||player?._id}`
        const html = resendOtpEmail(user.userName, otp, verificationLink)
        await sendEmail({ email: user.email, subject, html })

        // return success response
        return res.status(200).json({
            message: "check your email address"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.verify = async (req, res) => {
    try {
        const id = req.params.id
        const { otp } = req.body

        // Search for the latest OTP record the user
        let otpRecord = await OTPModel.findOne({ agentId: id }).sort({ createdAt: -1 })
        if (!otpRecord) {
            otpRecord = await OTPModel.findOne({ playerId: id }).sort({ createdAt: -1 })
        }
        if (!otpRecord) {
            return res.status(404).json({
                error: "OTP has expired"
            })
        }

        // Compare the OTP from the request with the one saved in the OTP record
        const isMatch = bcrypt.compareSync(otp, otpRecord.otp)

        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid OTP"
            })
        }

        // Fetch the user from the database
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "user not found"
            })
        }

        if (user.isVerified) {
            return res.status(200).json({
                message: "this account has already been verified"
            })
        }

        // Update user's isVerified status to true if not verified
        user.isVerified = true

        // Delete the OTP record after successful verification
        await OTPModel.findByIdAndDelete(otpRecord._id)

        // otpRecord
        await user.save()

        // Generate JWT token for the user
        const token = jwt.sign({
            userId: user._id,
            userName: user.userName
        }, process.env.jwtkey, { expiresIn: '30d' })

        return res.status(200).json({
            message: "verified",
            user,
            token
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}


exports.logIn = async (req, res) => {
    try {
        const { userName, password } = req.body

        // Check if at least one identifier is provided
        if (!userName) {
            return res.status(400).json({
                error: "Input username"
            })
        }

        // Check if password is provided
        if (!password) {
            return res.status(400).json({
                error: "input password"
            })
        }

        // Search for the user based on userName, email, or phoneNumber
        const user = await agentModel.findOne({ userName }) || await playerModel.findOne({ userName })
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                error: "Account not verified, please verify."
            })
        }

        // Compare the provided password with the hashed password stored in the database
        const checkPassword = await bcrypt.compare(password, user.password)

        if (!checkPassword) {
            return res.status(400).json({
                error: "Incorrect password."
            })
        }

        const admin = await adminModel.findOne({ suspended: user._id })
        if (admin) {
          return res.status(403).json({
            message: "This account has been suspended.",
          })
        }

        // Generate JWT token
        const token = jwt.sign({
            userId: user._id,
            userName: user.userName
        }, process.env.jwtkey, { expiresIn: '30d' })

        res.status(200).json({
            message: "Login successful.",
            user,
            token
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.logOut = async (req, res) => {
    try {
        const hasAuthorization = req.headers.authorization

        if (!hasAuthorization) {
            return res.status(401).json({
                error: "Authorization token not found",
            })
        }

        const token = hasAuthorization.split(" ")[1]

        if (!token) {
            return res.status(401).json({
                error: "Authorization token not found",
            })
        }

        const decodedToken = jwt.verify(token, process.env.jwtkey)

        const user = await playerModel.findById(decodedToken.userId) || await agentModel.findById(decodedToken.userId)
        if (!user) {
            return res.status(404).json({
                error: "User not found",
            })
        }

        const expiredToken = jwt.sign({
            userId: user._id,
            userName: user.userName
        }, process.env.jwtkey, { expiresIn: '1sec' })

        res.status(200).json({
            message: "Logged out successfully",
            expiredToken
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.forgotPassword = async (req, res) => {
    try {
        const { id } = req.params
        const { email } = req.body

        // Find user by email in either agent or player collection
        const user = await agentModel.findOne({ email, _id: id }) || await playerModel.findOne({ email, _id: id })
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            })
        }

        // generate a token for the user
        const token = jwt.sign({
            userId: user._id,
            email: user.email,
        }, process.env.jwtkey, { expiresIn: "5mins" })

        // Send email with OTP and verification link
        const Email = user.email
        const subject = 'Reset Password'
        const verificationLink = `https://pronext.onrender.com/reset_password/${token}`
        const html = resetFunc(Email, verificationLink)
        await sendEmail({ email: user.email, subject, html })

        // Respond with success message
        res.status(200).json({
            message: 'A mail has been sent to you.'
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.resetPassword = async (req, res) => {
    try {
        const id = req.params.id

        const { newPassword, confirmPassword } = req.body

        if (!confirmPassword) {
            return res.status(400).json({
                error: "Confirm your password"
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: "Passwords do not match"
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        user.password = hashedPassword
        await user.save()

        res.status(200).json({
            message: `new password is saved`
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.changePassword = async (req, res) => {
    try {
        const id = req.user.userId

        const { currentPassword, newPassword, confirmPassword } = req.body

        if (!confirmPassword) {
            return res.status(400).json({
                error: "Confirm password."
            })
        }

        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        const checkPassword = await bcrypt.compare(currentPassword, user.password)
        if (!checkPassword) {
            return res.status(401).json({
                error: "Incorrect password"
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: "Passwords do not match."
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        user.password = hashedPassword
        await user.save()

        return res.status(200).json({
            message: `new password is saved`
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.updateUserName = async (req, res) => {
    try {
        const id = req.user.userId
        const { userName } = req.body

        // Check if a new userName is provided in the body
        if (!userName) {
            return res.status(400).json({
                error: "This feild can't be left empty"
            })
        }

        // Check if user already exists in the agentModel or playerModel
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        // Check if the new userName is already taken by another user
        const existingUser = await agentModel.findOne({ userName }) || await playerModel.findOne({ userName })
        // Throw an error if userName is already taken
        if (existingUser) {
            return res.status(403).json({
                error: `${userName} is taken.`
            })
        }
        if (userName.length < 8) {
            return res.status(400).json({
                error: "Username must be at least 8 characters long"
            })
        }

        user.userName = userName
        await user.save()

        res.status(200).json({
            username: user.userName
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.updateEmail = async (req, res) => {
    try {
        const id = req.user.userId 
        const { password, email } = req.body 

        // Validate the new email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address',
            })
        }

        // Find user by ID from either model
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            })
        }

        // Check if the user record contains a password
        if (!user.password) {
            return res.status(400).json({
                error: 'Password not found in user record.',
            })
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({
                error: 'Incorrect password.',
            })
        }

        // Update the user's email
        user.email = email
        await user.save() 

        return res.status(200).json({
            message: 'Email updated successfully.',
            email: user.email,
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.updateUserProfile = async (req, res) => {
    try {
        const id = req.user.userId

        const { name, phoneNumber, countryCode, Birthday, Bio, relationship_status } = req.body

        const updateFields = {}
        if (name !== undefined) updateFields.name = name
        if (Birthday !== undefined) updateFields.Birthday = Birthday
        if (Bio !== undefined) updateFields.Bio = Bio
        if (relationship_status !== undefined) updateFields.relationship_status = relationship_status
        if (phoneNumber !== "") {
            if (!countryCode) {
                return res.status(400).json({
                    error: "Country code is required for this phone number"
                })
            }

            const fullPhoneNumber = `${countryCode} ${phoneNumber}`

            const validNumber = parsePhoneNumber(fullPhoneNumber)
            if (!validNumber.isValid()) {
                return res.status(400).json({
                    error: "Invalid phone number"
                })
            }
            updateFields.phoneNumber = fullPhoneNumber
        }else {
            updateFields.phoneNumber = ""
        }

        let user = await agentModel.findByIdAndUpdate(id, updateFields, { new: true })
        if (!user) {
            user = await playerModel.findByIdAndUpdate(id, updateFields, { new: true })
        }

        if (!user) {
            return res.status(400).json({
                error: "Unexpected error while updating your profile."
            })
        }

        res.status(200).json({
            name: user.name !== undefined ? user.name : "Default Name",
            phoneNumber: user.phoneNumber !== undefined ? user.phoneNumber : "Default Phone Number",
            Birthday: user.Birthday !== undefined ? user.Birthday : "Default Birthday",
            Bio: user.Bio !== undefined ? user.Bio : "Default Bio",
            relationship_status: user.relationship_status && user.relationship_status.trim() !== "" ? user.relationship_status : "single"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.createProfileImg = async (req, res) => {
    try {
        const id = req.user.userId

        // Check if user exists in agentModel or playerModel
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        // Validate file upload
        const file = req.file
        if (!file || !file.path) {
            return res.status(400).json({ 
                error: "File upload is required" 
            })
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' })

        // Delete the file from local storage
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error('Failed to delete local file', err)
            }
        })

        // Update user profile image URL
        user.profileImg = result.secure_url
        await user.save()

        // Send success response
        res.status(200).json({
            profileImg: user.profileImg
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}


exports.deleteProfileImg = async (req, res) => {
    try {
        const id = req.user.userId

        // Find the agent in the database
        const user = await agentModel.findById(id) || await playerModel.findById(id)

        // Delete profile image from Cloudinary if exists
        if (user.profileImg) {
            const oldImage = user.profileImg.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(oldImage)
        }

        // Update profile image URL in the database to default
        user.profileImg = "https://i.pinimg.com/564x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg"
        await user.save()

        // Send success response
        res.status(200).json(user.profileImg)
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getUsers = async (req, res) => {
    try {
        const id = req.user.userId
        if (!id) {
            return res.status(404).json({
                error: "Session expired. Please log in."
            })
        }

        const username = req.body.username
        if (!username) {
            return res.status(400).json({
                error: "input username"
            })
        }

        const regex = new RegExp(username, 'i')

        // Find users whose usernames match the regular expression
        const playerPromise = playerModel.find({ userName: regex })
        const agentPromise = agentModel.find({ userName: regex })

        const [player, agent] = await Promise.all([playerPromise, agentPromise])

        // Combine agent and player into one array
        const users = [...player, ...agent]

        if (users.length === 0) {
            return res.status(404).json({
                error: `${username} not found.`
            })
        }

        // Success message
        return res.status(200).json(users)

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.follow = async (req, res) => {
    try {
      const id = req.user.userId
      const { entityId } = req.body
  
      if (id === entityId) {
        return res.status(400).json({
          error: "Cannot follow yourself."
        })
      }
  
      // Find the user in either agentModel or playerModel
      const user = await agentModel.findById(id) || await playerModel.findById(id)
      if (!user) {
        return res.status(404).json({
          error: "User not found."
        })
      }
  
      // Find the entity to be followed in agentModel or playerModel
      const entity = await agentModel.findById(entityId) || await playerModel.findById(entityId)
      if (!entity) {
        return res.status(404).json({
          error: "User not found."
        })
      }
  
      // Ensure unique follow relationships
      const following = user.following.includes(entityId)
      const follow = entity.followers.includes(id)
  
      if (following && follow) {
        return res.status(400).json({
          error: `${entity.userName} is already followed by you.`
        })
      }
  
      // Update the following list of the user
      if (!following) {
        user.following.push(entityId)
      }
  
      // Update the followers list of the entity and create a notification
      if (!follow) {
        entity.followers.push(id)
  
        const notification = {
          notification: `${user.userName} started following you`,
          recipient: entity._id,
          recipientModel: entity instanceof agentModel ? 'agent' : 'player'
        }
  
        // Assign the correct field based on the model
        if (entity instanceof agentModel) {
          notification.agent = entity._id
        } else if (entity instanceof playerModel) {
          notification.player = entity._id
        }
  
        const message = new notificationModel(notification)
        await message.save()
  
        // Add the notification to the entity's notifications list
        entity.notifications.push(message._id)
      }
  
      // Save changes
      await Promise.all([user.save(), entity.save()])
  
      return res.status(200).json({
        followers: entity.followers.length
      })
    } catch (error) {
      res.status(500).json({
        error: error.message
      })
    }
  }
  

exports.unfollow = async (req, res) => {
    try {
        const id = req.user.userId

        const { entityId } = req.body

        if (id === entityId) {
            return res.status(400).json({
                error: "Cannot unfollow yourself."
            })
        }

        // Find the user  making this request
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        const entity = await agentModel.findById(entityId) || await playerModel.findById(entityId)
        if (!entity) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Remove follower from user's following list
        const userFollowing = user.following.indexOf(entityId)
        if (userFollowing !== -1) {
            user.following.splice(userFollowing, 1)
        }

        // Remove user from follower's followers list
        const indexInEntityFollowers = entity.followers.indexOf(id)
        if (indexInEntityFollowers !== -1) {
            entity.followers.splice(indexInEntityFollowers, 1)
        }

        // Save changes
        await Promise.all([user.save(), entity.save()])

        return res.status(200).json({
            message: `You've unfollowed ${entity.userName}.`,
            followers: entity.followers.length
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getOneFollower = async (req, res) => {
    try {
        const id = req.user.userId
        const { userName } = req.body
        let { limit, page } = req.query

        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }

        // Check if follower is found in either playerModel or agentModel
        const followers = user.followers.map(async (followerId) => {
            const follower = await playerModel.findById(followerId) || await agentModel.findById(followerId)
            if (follower && follower.userName.includes(userName)) {
                return {
                    id: follower._id.toString(),
                    username: follower.userName
                }
            }
            return null
        })

        // Wait for all followers to be processed
        const resolvedFollowers = await Promise.all(followers)

        const validFollowers = resolvedFollowers.filter(follower => follower !== null)

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        // Slice the followers array to get the followers for the current page
        const Followers = validFollowers.slice(startIndex, endIndex)

        // Check if there are more pages
        const totalPages = Math.ceil(validFollowers.length / limit)
        const nextPage = endIndex < validFollowers.length

        return res.status(200).json({
            Followers,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getAllFollowers = async (req, res) => {
    try {
        const id = req.user.userId

        let { limit, page } = req.query

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }

        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Calculate the total number of followers
        const totalFollowers = user.followers.length

        // Calculate the start and end indices for pagination
        const startIndex = (page - 1) * limit
        const endIndex = Math.min(page * limit, totalFollowers)

        // Get the followers for the current page
        const followers = user.followers.slice(startIndex, endIndex)

        // Check if each follower follows back
        const followersWithFollowBackInfo = await Promise.all(
            followers.map(async (followerId) => {
                // Check if follower is found in both playerModel and agentModel
                const [playerFollower, agentFollower] = await Promise.all([
                    playerModel.findById(followerId),
                    agentModel.findById(followerId)
                ])

                const followedBack = playerFollower
                    ? playerFollower.followers.includes(id)
                    : agentFollower
                        ? agentFollower.followers.includes(id)
                        : false

                return { followerId, followedBack }
            })
        )

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalFollowers / limit)
        const nextPage = page < totalPages

        return res.status(200).json({
            totalFollowers,
            followers: followersWithFollowBackInfo,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getOneFollowing = async (req, res) => {
    try {
        const id = req.user.userId
        const { userName } = req.body

        // Find the user in either the agentModel or playerModel
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        const matchingUsers = []
        for (const followingId of user.following) {
            const followingUser = await playerModel.findById(followingId) || await agentModel.findById(followingId)
            if (followingUser && followingUser.userName.includes(userName)) {
                const followsBack = followingUser.followers.includes(id)

                matchingUsers.push({
                    id: followingUser._id.toString(),
                    username: followingUser.userName,
                    followsBack
                })
            }
        }

        if (matchingUsers.length === 0) {
            return res.status(404).json({
                error: "user not found"
            })
        }

        return res.status(200).json(matchingUsers)
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getAllFollowing = async (req, res) => {
    try {
        const id = req.user.userId
        let { limit, page } = req.query

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }

        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Calculate the total number users the current user is following
        const Following = user.following.length

        // Calculate amount of following users of the user
        const startIndex = (page - 1) * limit
        const endIndex = Math.min(page * limit, user.following.length)

        const following = user.following.slice(startIndex, endIndex)

        // Check if each following user follows back
        const followersWithFollowBackInfo = await Promise.all(
            following.map(async (followerId) => {
                // Check if follower is found in both playerModel and agentModel
                const [playerFollower, agentFollower] = await Promise.all([
                    playerModel.findById(followerId),
                    agentModel.findById(followerId)
                ])

                const followedBack = playerFollower
                    ? playerFollower.following.includes(id)
                    : agentFollower
                        ? agentFollower.following.includes(id)
                        : false

                return { followerId, followedBack }
            })
        )

        // Check if there are more pages
        const totalPages = Math.ceil(user.following.length / limit)
        const nextPage = page < totalPages

        return res.status(200).json({
            Following,
            following: followersWithFollowBackInfo,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.userId

        // Attempt to find and delete the user from both models
        const user = await agentModel.findByIdAndDelete(id) || await playerModel.findByIdAndDelete(id)

        // If no user was found and deleted, respond with an error
        if (!user) {
            return res.status(400).json({
                error: "Unable to delete account"
            })
        }

        // If the user had a profile image, delete it from Cloudinary
        if (user.profileImg) {
            const oldImage = user.profileImg.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(oldImage)
        }

        // Respond with a success message
        res.status(200).json({
            message: "Deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}