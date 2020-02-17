const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const {check, validationResult} = require('express-validator/check');

// @route   GET api/profile/me
// @desc    Get Logged in user Info
// @access  Private
router.get("/me", auth, async (req, res) =>{
    try{
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).send({msg : "There is no Profile for This User"});
        }

        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/profile
// @desc    Create Or update User Profile
// @access  Private

router.post('/',[ auth, 
            [
            check('status', 'Status is Required').not().isEmpty(),
            check('skills', 'Skills is REquired').not().isEmpty()
        ]
    ], async (req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors : errors.array() })
        }

        //Setup Data Variable Coming from the frontend body
        const {
            handle,
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            youtube,
            twitter,
            facebook,
            linkedin,
            instagram,
        } = req.body;

        //Build Profile Object
        const profileFields = {};
        profileFields.user = req.user.id;
        if(handle) profileFields.handle = handle;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(status) profileFields.status = status;
        if(bio) profileFields.bio = bio;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }
        console.log(profileFields.skills);

        //Build Social Object
        profileFields.social = {};
        if(youtube) profileFields.social.youtube = youtube;
        if(twitter) profileFields.social.twitter = twitter;
        if(facebook) profileFields.social.facebook = facebook;
        if(linkedin) profileFields.social.linkedin = linkedin;
        if(instagram) profileFields.social.instagram = instagram;
        
        try{
            
            let profile = await Profile.findOne({user : req.user.id});
            if(profile){
                //Update
                profile = await Profile.findOneAndUpdate(
                    { user : req.user.id }, 
                    { $set : profileFields }, 
                    { new : true }
                );
                return res.json(profile);
            }else{
                //Create
                 profile = new Profile(profileFields);

                 await profile.save();
                 return res.json(profile);
            }
                       

        }catch(err){
            console.error(err.message);
            res.status(500).send("Server Error");
        }
});

// @route   POST api/profile
// @desc    Get all User Profile
// @access  Public
router.get('/', async (req, res) =>{
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get all User Profile
// @access  Public
router.get('/user/:user_id', async (req, res) =>{
    try {
        const profile = await Profile.findOne({user : req.params.user_id}).populate('user', ['name', 'avatar']);
        if(!profile){
            res.status(400).json({msg : "Profile Not Found"});
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            res.status(400).json({msg : "Profile Not Found"});
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/
// @desc    Delete Logged In User
// @access  Private
router.delete('/', auth,  async (req, res) =>{
    try {
        //@todo - remove user's post

        //Delete Profile
        await Profile.findOneAndRemove({user : req.user.id});
        //Delete User
        await User.findOneAndRemove({ _id : req.user.id });
        
        res.json({ msg : 'User Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add Experiene for a Logged In User
// @access  Private
router.put('/experience', [auth , 
        [
            check('title', 'Title is Required').not().isEmpty(),
            check('from', 'Starting Date is Required').not().isEmpty(),
            check('company', 'Company is Required').not().isEmpty()
    ]
],
async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title : title,
        company : company,
        location : location,
        from : from,
        to : to,
        current : current,
        description : description
    }

    try {
        let profile = await Profile.findOne({ user : req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();

        res.json(profile);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Server Error');       
    }
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delele Experience from Profile for a Logged In User
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) =>{
    try {
        let profile = await Profile.findOne({ user : req.user.id });
        
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg : "Experience Not Found"});
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/education
// @desc    Add Education for a Logged In User
// @access  Private
router.put('/education', [auth, 
        [
            check('school', 'School is Required').not().isEmpty(),
            check('degree', 'Degree is Required').not().isEmpty(),
            check('from', 'Start date is Required').not().isEmpty(),
        ]
    ], 
    async (req, res) =>{
    var errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school      : school,
        degree      : degree,
        fieldofstudy : fieldofstudy,
        from        : from,
        to          : to,
        current     : current,
        description : description
    }

    try {
        let profile = await Profile.findOne({ user : req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Delele Education from Profile for a Logged In User
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res)=>{
    try {
        let profile = await Profile.findOne({ user : req.user.id });
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
module.exports = router;