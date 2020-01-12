const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const config = require("config");
const {check, validationResult} = require("express-validator");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", auth, 
async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    }catch(err){
        if(err){
            res.json(err.message);
            res.status(500).json({msg : "Server Error"});
        }
    }
});

router.post("/",
[
    check('email', "Invalid Email").isEmail(),
    check('password', "Invalid Password").exists()
], 
    async (req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()});
        }
        const {email, password} = req.body;
        try{
            let user = await User.findOne({email});
            if(!user){
                return res.status(400).json({msg: "Invalid Credentials"});
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch){
                return res.status(400).json({msg: "Invalid Credentials"});
            }

            const payload = {
                user :{
                    id : user.id
                }
            };

            jwt.sign(
                payload,
                config.get("jwtSecret"),
                {expiresIn : 360000},
                (err, token)=>{
                    if(err) throw err;
                    return res.json({token});
                }
            );
        }catch(err){
            console.error(err.message);
        }
    }
)

module.exports = router;