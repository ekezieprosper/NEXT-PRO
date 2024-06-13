const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const OTPModel = require('../models/otpModel')
const subscriptionModel = require("../models/subscriptionModel")
const bcrypt = require("bcrypt")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const DynamicEmail = require("../Emails/emailIndex")
const sendEmail = require("../Emails/email")
const {resetFunc} = require("../Emails/resthtml")
const cloudinary = require("../media/cloudinary")
const resendOtpEmail = require("../Emails/resendOtp")


exports.home = (req, res) => {
    res.send("<h1>....Connecting players to the real world of football.</h1>")
}


exports.signupPlayer = async (req, res) => {
    try {
        // Required information for registration
        const {userName, password, gender, position, email} = req.body

        if (!position) {
            return res.status(400).json({
                error: 'enter position'
            })
        }

        // Basic email validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                error: 'invalid email address'
            })
        }

        // Check if the email already exists in the agent database
        const Email = await agentModel.findOne({email}).limit(1)

        if (Email) {
            return res.status(403).json({
                error: `${email} can not be used for signup as a player`
            })
        }

        if (userName.length < 8) {
            return res.status(400).json({
                error: "Username must be at least 8 characters long"
            })
        }

        if (!userName.toLowerCase()) {
            return res.status(400).json({
                error: "Username must be in lowercase."
            })
        }

        if (!/^[a-z0-9_.-]+$/.test(userName)) {
            return res.status(400).json({
                error: "Only numbers, hyphens, and underscores can be added if needed."
            })
        }

        // Check if user already exists in the database
        let searchUsername = await agentModel.findOne({userName}).limit(1)
        if (!searchUsername) {
            searchUsername = await playerModel.findOne({userName}).limit(1)
        }

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
            userName,
            password: hashpass,
            gender,
            position,
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
            error: "Internal server error"
        })
    }
}

exports.signupAgent = async (req, res) => {
    try {
        // required information for registration
        const {userName, password, gender, email} = req.body

        // Basic email validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                error: 'Invalid email address'
            })
        }

        // Check if the email exists in the player's database
        const Email = await playerModel.findOne({email}).limit(1)

        if (Email) {
            return res.status(403).json({
                error: `${email} can not be used for signup as an agent`
            })
        }

        if (userName.length < 8) {
            return res.status(400).json({
                error: "Username must be at least 8 characters long"
            })
        }

        if (!userName.toLowerCase()) {
            return res.status(400).json({
                error: "Username must be in lowercase."
            })
        }

        if (!/^[a-z0-9_.-]+$/.test(userName)) {
            return res.status(400).json({
                error: "Only numbers, hyphens, and underscores can be added if needed."
            })
        }

        // check if user already exists in the database
        let searchUsername = await agentModel.findOne({userName}).limit(1)
        if (!searchUsername) {
            searchUsername = await playerModel.findOne({userName}).limit(1)
        }

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
            userName,
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
            error: "Internal server error"
        })
    }
}


const sendOtp = async (agent, player, otp) => {
    try {
        const subject = "Email Verification"
        const userName = agent ? agent.userName : player.userName
        const email = agent ? agent.email : player.email
        const text = `Verification code ${otp}`
        const verificationLink = `https://elitefootball/verify/${agent?._id||player?._id}`
        const html = DynamicEmail(userName, otp, verificationLink)
        await sendEmail({email, subject, text, html})

        // Hash OTP then save it to the database
        const saltotp = bcrypt.genSaltSync(10)
        const hashotp = bcrypt.hashSync(otp, saltotp)

        await OTPModel.create({
            agentId: agent ? agent._id : undefined,
            playerId: player ? player._id : undefined,
            otp: hashotp
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.resendOTP = async (req, res) => {
    try {
        const id = req.params.id

        const agent = await agentModel.findById(id)
        const  player = await playerModel.findById(id)
        
        const user = player || agent

        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Check if the account is already verified
        if (user.isVerified) {
            return res.status(400).json({
                error: "this account has already been verified"
            })
        }

        // Generate 6-digit OTP
        const otp = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')

        //// hash OTP then save it to the database
        const saltotp = bcrypt.genSaltSync(10)
        const hashotp = bcrypt.hashSync(otp, saltotp)

        // Save the hashed OTP in the OTPModel for verification
        await OTPModel.create({
            agentId:agent ? id :undefined,
            playerId:player? id :undefined,
            otp: hashotp
        })
    

        // Send the OTP to the agent's email
        const subject = "Email Verification"
        const text = `Verification code ${otp}`
        const html = resendOtpEmail(user.userName, otp)
        await sendEmail({email: user.email, subject, text, html})

       

        return res.status(200).json({
            message: "check your email address"
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.verify = async (req, res) => {
    try {
        const id = req.params.id
        const {otp} = req.body

        // Search for the latest OTP record the user
        let otpRecord = await OTPModel.findOne({agentId: id}).sort({createdAt: -1})
        if (!otpRecord) {
            otpRecord = await OTPModel.findOne({playerId: id}).sort({createdAt: -1})
        }

        if (!otpRecord) {
            return res.status(404).json({
                error: "OTP not found"
            })
        }

        const otpCreatedAt = new Date(otpRecord.createdAt)
        const otpExpirationTime = new Date(otpCreatedAt.getTime() + (5 * 60 * 1000))
        const currentTime = new Date()

        if (currentTime > otpExpirationTime) {
            // Delete the OTP record from the database
            await OTPModel.deleteOne({_id: otpRecord._id})

            return res.status(400).json({
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
        let user = await agentModel.findById(id)
        if (!user) {
            user = await playerModel.findById(id)
        }

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
        }, process.env.jwtkey, {expiresIn:'30d'})


        // Assign the token to the user and save
        user.tokens = token
        await user.save()

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.logIn = async (req, res) => {
    try {
        const {userName, password} = req.body

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
        let user = await agentModel.findOne({userName}).limit(1)
        if (!user) {
            user = await playerModel.findOne({userName}).limit(1)
        }


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

        // Generate JWT token
        const token = jwt.sign({
            userId: user._id,
            userName: user.userName
        }, process.env.jwtkey, {expiresIn: '30d'})

        // Assign the token to the user and save
        user.tokens = token
        await user.save()

        res.status(200).json({
            message: "Login successful.",
            user
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
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

        let user = await playerModel.findById(decodedToken.userId)

        if (!user) {
            user = await agentModel.findById(decodedToken.userId)
        }

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            })
        }

        user.tokens = null
        await user.save()

        res.status(200).json({
            message: "Logged out successfully",
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.forgotPassword = async (req, res) => {
    try {
        const {email} = req.body
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'Invalid email address'
            })
        }
        const agent = await agentModel.findById(id)
        const player = await playerModel.findById(id)

        const checkUser = agent || player


    let Email = await agentModel.findOne({email}) || await playerModel.findOne({email})

        if (!Email) {
            return res.status(404).json({
                error: `email not found`
            })
        } else {
            const otp = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')

            // hash OTP then save it to the database
            const saltotp = bcrypt.genSaltSync(10)
            const hashotp = bcrypt.hashSync(otp, saltotp)    

            // Send the OTP to the user's email
            const subject = "Reset Password"
        const verificationLink = `https://elitefootball/reset_password/${checkUser._id}`

            const html = resetFunc(checkUser.userName, otp, verificationLink)
            await sendEmail({email: checkUser.email, subject, html})

                 
        // Save the hashed OTP in the OTPModel for verification
        await OTPModel.create({
            agentId:agent ? id :undefined,
            playerId:player? id :undefined,
            otp: hashotp
        })

            res.status(200).json({
                message: `An otp code has been sent to your email.`,
            })
        }
    } catch (err) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.verifyPasswordOTP = async (req, res) => {
    try {
        const id = req.params.id
        const {otp} = req.body

        // Search for the latest OTP record the user
        let otpRecord = await OTPModel.findOne({agentId: id}).sort({createdAt: -1})
        if (!otpRecord) {
            otpRecord = await OTPModel.findOne({playerId: id}).sort({createdAt: -1})
        }

        if (!otpRecord) {
            return res.status(404).json({
                error: "OTP not found"
            })
        }

        const otpCreatedAt = new Date(otpRecord.createdAt)
        const otpExpirationTime = new Date(otpCreatedAt.getTime() + (5 * 60 * 1000))
        const currentTime = new Date()

        if (currentTime > otpExpirationTime) {
            // Delete the OTP record from the database
            await OTPModel.deleteOne({_id: otpRecord._id})

            return res.status(400).json({
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

        await OTPModel.findByIdAndDelete(otpRecord._id)

        // Send success response
        return res.status(200).json({
            message: "verified."
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.resetPassword = async (req, res) => {
    try {
        const id = req.params.id

        const {newPassword, confirmPassword} = req.body

        // Input Validation
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                error: "Input a new password."
            })
        }

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

        // find user
        let user = await agentModel.findById(id)
        if (!user) {
            user = await playerModel.findById(id)
        }

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        user.password = hashedPassword
        await user.save()

        res.status(200).json({
            message: `your new password has been saved`
        })

    } catch (err) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.changePassword = async (req, res) => {
    try {
        const id = req.user.userId

        const {recentPassword, newPassword, confirmPassword} = req.body

        if (!recentPassword) {
            return res.status(400).json({
                error: "Input recent password."
            })
        }

        if (!newPassword) {
            return res.status(400).json({
                error: "Input a new password."
            })
        }

        if (!confirmPassword) {
            return res.status(400).json({
                error: "Confirm password."
            })
        }

        let user = await agentModel.findById(id)
        if (!user) {
            user = await playerModel.findById(id)
        }

        const checkPassword = await bcrypt.compare(recentPassword, user.password)

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
            message: `your new password has been saved`
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.updateUserName = async (req, res) => {
    try {
        const id = req.user.userId
        const {userName} = req.body

        // Check if a new userName is provided in the body
        if (!userName) {
            return res.status(400).json(null)
        }

        // Check if user already exists in the database
          // Check if user exists in agentModel
          let user = await agentModel.findById(id) || await playerModel.findById(id)
          if (!user) {
             return res.status(404).json({
              error: "User not found"
          })
       }
          

        // Check if the new userName is already taken by another user
        let existingUser = await agentModel.findOne({userName}) || await playerModel.findOne({userName})
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
            error: "Internal server error"
        })
    }
}


exports.updateEmail = async (req, res) => {
    try {
        const id = req.user.userId

        const {password, email} = req.body

        // Validate the new email address
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                error: 'Invalid email address'
            })
        }

        // Find user by id
        let user = await agentModel.findById(id)
        if (!user) {
            user = await playerModel.findById(id)
        }

        // Verify the password
        const checkPassword = await bcrypt.compare(password, user.password)
        if (!checkPassword) {
            return res.status(401).json({
                error: "Incorrect password"
            })
        }

        // Update the user's email
        user.email = email
        await user.save()

        return res.status(200).json({
            message: "email updated successfully.",
            email: user.email
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.updateUserProfile = async (req, res) => {
    try {
        const id = req.user.userId

        const {name, locatedAt, phoneNumber, Birthday, Bio, relationship_status} = req.body

        if (name.length < 3) {
            return res.status(400).json({
                error: "Too short"
            })
        }

        let user = await agentModel.findByIdAndUpdate(id, {
            name,
            locatedAt,
            phoneNumber,
            Birthday,
            Bio,
            relationship_status
        }, {new: true})

        if (!user) {
            user = await playerModel.findByIdAndUpdate(id, {
                name,
                locatedAt,
                phoneNumber,
                Birthday,
                Bio,
                relationship_status
            }, {new: true})
        }

        if (!user) {
            return res.status(400).json({
                error: `an unexpected error occured while updating profile`
            })
        }

        res.status(200).json({
            name: user.name,
            locatedAt: user.locatedAt,
            phoneNumber: user.phoneNumber,
            Birthday: user.Birthday,
            Bio: user.Bio,
            relationship_status: user.relationship_status
        })
    } catch (error) {
        res.status(500).json({
            error: "Bad internet connection."
        })
    }
}


exports.createProfileImg = async (req, res) => {
    try {
        const id = req.user.userId

        // Check if user exists in agentModel
        let user = await agentModel.findById(id) || await playerModel.findById(id)

        if (!user) {
           return res.status(404).json({
            error: "User not found"
        })
     }

        // Validate file upload
        const file = req.file
        if (!file || !file.path) {
            return res.status(400).json({ error: "File upload is required" })
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' })

        // Update user profile image URL
        user.profileImg = result.secure_url
        await user.save()

        // Send success response
        res.status(200).json({
             profileImg: user.profileImg 
            })

    } catch (error) {
        return res.status(500).json({
         error: "Bad internet connection"
      })
    }
}


exports.deleteProfileImg = async (req, res) => {
    try {
        const id = req.user.userId

        // Find the agent in the database
        let user = await agentModel.findById(id) || await playerModel.findById(id)

        // Delete profile image from Cloudinary if exists
        if (user.profileImg) {
            try {
                // Delete image from Cloudinary
                await cloudinary.uploader.destroy(user.profileImg)
            } catch (err) {
                return res.status(500).json({
                    error: "check your internet connection"
                })
            }
        }
        // Update profile image URL in the database to default
        user.profileImg = "https://t3.ftcdn.net/jpg/05/53/79/60/360_F_553796090_XHrE6R9jwmBJUMo9HKl41hyHJ5gqt9oz.jpg"
        await user.save()

        // Send success response
        res.status(200).json(user.profileImg)
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
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
        const playerPromise = playerModel.find({userName: regex})
        const agentPromise = agentModel.find({userName: regex})

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
            error: "Internal server error"
        })
    }
}


exports.follow = async (req, res) => {
    try {
        const id = req.user.userId

        const {entityId} = req.body

        if (id === entityId) {
            return res.status(400).json({
                error: "Cannot follow yourself."
            })
        }

        // Find the user
        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Find the entity based on entityId in both agentModel and playerModel
        let entity = await agentModel.findById(entityId) || await playerModel.findById(entityId)
        if (!entity) {
            return res.status(404).json({
                error: "user not found."
            })
        }

        // Get the userName of the entity
        const userName = entity.userName

        // Ensure unique follow relationships
        const Following = user.following.includes(entityId)
        const Follow = entity.followers.includes(id)

        if (Following && Follow) {
            return res.status(400).json({
                error: `${userName} is already followed by you.`
            })
        }

        // Update the following list of the user
        if (!Following) {
            user.following.push(entityId)
        }

        // Update the followers list of the entity
        if (!Follow) {
            entity.followers.push(id)
        }

        // Save changes
        await Promise.all([user.save(), entity.save()])

        return res.status(200).json({
            followers: entity.followers.length
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.unfollow = async (req, res) => {
    try {
        const id = req.user.userId

        const {entityId} = req.body

        if (id === entityId) {
            return res.status(400).json({
                error: "Cannot unfollow yourself."
            })
        }

        // Find the user  making this request
        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        let entity = await agentModel.findById(entityId) || await playerModel.findById(entityId)
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
            error: "Internal server error"
        })
    }
}


exports.getOneFollower = async (req, res) => {
    try {
        const id = req.user.userId
        const {userName} = req.body
        let {limit, page} = req.query

        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit): 10
        page = page ? parseInt(page): 1

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
            error: "Internal server error"
        })
    }
}


exports.getAllFollowers = async (req, res) => {
    try {
        const id = req.user.userId

        let {limit, page} = req.query

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }
 
        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Calculate amount of followers of the user
        const startIndex = (page - 1) * limit
        const endIndex = Math.min(page * limit, user.followers.length)

        const followers = user.followers.slice(startIndex, endIndex)

        // Check if each follower follows back
        const followersWithFollowBackInfo = await Promise.all(
            followers.map(async (followerId) => {
                // Check if follower is found in both playerModel and agentModel
                const [playerFollower, agentFollower] = await Promise.all([
                    playerModel.findById(followerId),
                    agentModel.findById(followerId)
                ])

                const followsBack = playerFollower
                    ? playerFollower.followers.includes(id)
                    : agentFollower
                        ? agentFollower.followers.includes(id)
                        : false
                return { followerId, followsBack }
            })
        )

        const totalPages = Math.ceil(user.followers.length / limit)
        const nextPage = page < totalPages

        return res.status(200).json({
            followers: followersWithFollowBackInfo,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getOneFollowing = async (req, res) => {
    try {
        const id = req.user.userId
        const {userName} = req.body
        let {limit, page} = req.query

        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if(!user){
            return res.status(404).json({
                error: "user not found"
            })
        }

        // Set default values for limit and page
        limit = limit ? parseInt(limit): 10
        page = page ? parseInt(page): 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }

        // Check if user is found in either playerModel or agentModel
        const following = user.following.map(async (followingId) => {
            const followingUser = await playerModel.findById(followingId) || await agentModel.findById(followingId)
            if (followingUser && followingUser.userName.includes(userName)) {
                return {
                    id: followingUser._id.toString(),
                    username: followingUser.userName
                }
            }
            return null
        })

        const resolvedFollowing = await Promise.all(following)
        const validFollowing = resolvedFollowing.filter(followingUser => followingUser !== null)

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        // Slice the following users array to get the users for the current page
        const Following = validFollowing.slice(startIndex, endIndex)

        // Check if there are more pages
        const totalPages = Math.ceil(validFollowing.length / limit)
        const nextPage = endIndex < validFollowing.length

        return res.status(200).json({
            Following,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getAllFollowing = async (req, res) => {
    try {
        const id = req.user.userId
        let {limit, page} = req.query

        // Set default values for limit and page if not provided
        limit = limit ? parseInt(limit): 10
        page = page ? parseInt(page): 1

        // Validate limit and page
        if (isNaN(limit) || limit <= 0 || isNaN(page) || page <= 0) {
            return res.status(400).json({
                error: "Invalid limit or page value."
            })
        }

        let user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Calculate amount of following users of the user
        const startIndex = (page - 1) * limit
        const endIndex = Math.min(page * limit, user.following.length)

        const following = user.following.slice(startIndex, endIndex)

        // Check if each following user follows back
        const followingWithFollowBackInfo = await Promise.all(
            following.map(async (followingId) => {
                // Check if following user is found in both playerModel and agentModel
                const [playerFollowing, agentFollowing] = await Promise.all([
                    playerModel.findById(followingId),
                    agentModel.findById(followingId)
                ])

                const followsBack = playerFollowing
                    ? playerFollowing.followers.includes(id)
                    : agentFollowing
                        ? agentFollowing.followers.includes(id)
                        : false
                return { followingId, followsBack }
            })
        )

        // Check if there are more pages
        const totalPages = Math.ceil(user.following.length / limit)
        const nextPage = page < totalPages

        return res.status(200).json({
            following: followingWithFollowBackInfo,
            totalPages,
            currentPage: page,
            nextPage
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.subscription = async (req, res) => {
    try {
        const id = req.user.userId
        const {plan} = req.body

        if (!plan) {
            return res.status(400).json({
                error: "Plan is required."
            })
        }

        let user = await playerModel.findById(id)
        if (!user) {
            user = await agentModel.findById(id)
        }

        if (!user) {
            return res.status(404).json({
                error: "User not found."
            })
        }

        // Create new subscription
        const subscription = new subscriptionModel({plan, owner: id})
        user.subscribed = true
        await user.save()
        subscription.subscribed = true
        await subscription.save()


        res.status(201).json({
            message: `subscription for $${subscription.amount} oneOff ${plan} plan was successfull.`,
            id: subscription._id,
            plan: subscription.plan,
            expires_in: `${subscription.expiresIn}`
            
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getSubscription = async (req, res) => {
    try {
        const id = req.user.userId

        let user = await playerModel.findById(id) || await agentModel.findById(id)

        // Find the subscription by owner ID
        const subscription = await subscriptionModel.findOne({owner: id})

        if (id !== subscription.owner) {
            return res.status(401).json({
                error: "Unauthorized."
            })
        }

        if (!subscription) {
            return res.status(404).json({
                message: "No active subscription"
            })
        }

        // Check if the subscription is expired and delete it
        if (subscription.isExpired()) {
            await subscriptionModel.deleteOne({_id: subscription._id})
            user.subscribed = false
            await user.save()
            return res.status(404).json({
            message: `Your $${subscription.amount} ${subscription.plan} subscription plan has expired`
            })
        }

        return res.status(200).json({
            message: `valid till ${subscription.expiresIn}`
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}

 
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.userId

        let deleteAcct = await agentModel.findByIdAndDelete(id)
        if (!deleteAcct) {
            deleteAcct = await playerModel.findByIdAndDelete(id)
        }

        if (!deleteAcct) {
            return res.status(400).json({
                error: "Unable to delete account"
            })
        }

        res.status(200).json({
            message: "deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}