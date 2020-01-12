const express                   = require("express");
const router                    = express.Router();
const {check, validationResult} = require('express-validator');
const gravatar                  = require("gravatar");
const bcrypt                    = require("bcryptjs");

const User = require("../../models/User");
// @route   GET api/users
// @desc    Register User
// @access  Public
router.post("/",
[
    check('name',"Name is Required")
    .not()
    .isEmpty(),
    check('email', "Enter an Valid Email").isEmail(),
    check(
        'password',
        "Enter Password more than length 6"
    ).isLength({min: 6})
],
 async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({error: errors.array()});
    }

    const {name, email, password} = req.body;
    try{
        //See if User is Registered
        let user = await User.findOne({ email });
        if(user){
            return res.status(400).json({error : [{msg: "User Already Registered"}]});
        }


        //Get User Gravatar
        const avatar = grasvatar.url(email,{
            s: "200",
            r: "pg",
            d: "mm"
        });
        
        user = new User({
            name,
            email, 
            avatar,
            password
        });

        //Encrypt Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await  user.save();

        //Return JSONWebToken
        res.send("User Registered")
    }catch(err){
        console.log(err.message);
        return res.status(500).send("Server Error");
    }
});

module.exports = router;