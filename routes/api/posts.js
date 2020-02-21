const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check")
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
// @route   POST api/posts
// @desc    Add a Post to the Logged in User
// @access  Private
router.post("/", [ auth, 
    [
    check('title', 'Title is Required').not().isEmpty(),
    check('body', 'Body cannot be Empty').not().isEmpty()
    ] 
],
    async (req, res) =>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({errors : errors.array()});
        }
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            user : req.user.id,
            title : req.body.title,
            body : req.body.body,
            name : user.name,
            avatar : user.avatar
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// @route   GET api/posts
// @desc    List All Posts
// @access  Private

router.get('/', auth, async(req, res) => {
    try {
        const post = await Post.find().sort({ date : -1 });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET api/posts/:post_id
// @desc    Find Post by Id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if(!post){
           return res.status(404).json({ msg : "Post Not Found" });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg : "Post Not Found" });
        }
        res.status(500).send("Server Error");
    }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete Post By Id
// @access  Private
router.delete('/:post_id', auth, async (req, res) =>{
    try {
        const post = await Post.findById(req.params.post_id);
        if(!post){
            res.status(404).send("Post Not Available");
        }
        if(post.user.toString() !== req.user.id){
            res.status(401).json({ msg : "User Not Authorized" });
        }
        await post.remove();
        res.status(200).json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).send("Post Not available");
        }
        res.status(500).send("Server Error");
    }
});

// @route   PUT api/posts/like/:id
// @desc    Likes a Post for a Logged in User
// @access  Private
router.put("/like/:id", auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //Check if a post has already been liked by liked in user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            res.status(400).json({ msg : "Post Already Liked" });
        }else{
            post.likes.unshift({ user : req.user.id });
            await post.save();
            res.json(post.likes);
        }
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   PUT api/posts/unlike/:id
// @desc    Likes a Post for a Logged in User
// @access  Private
router.put("/unlike/:id", auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //Check if a post has already been liked by liked in user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            res.status(400).json({ msg : "Post hasn't been liked" });
        }else{
            const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
            post.likes.splice(removeIndex, 1);
            await post.save();
            res.json(post.likes);
        }
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/posts/comment/:post_id
// @desc    Posts Comment for a Logged In User on a specific post
// @access  Private

router.post('/comment/:post_id', [ auth, 
    [
        check('text', "Comment Text is Required").not().isEmpty()
    ] 
], async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        const user = await User.findById(req.user.id);
        const newComment = {
            text : req.body.text,
            user : req.user.id,
            name : user.name,
            avatar : user.avatar
        }

        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   DELETE api/posts/comment/:post_id/:comment:id
// @desc    Deletes a specific Comment by ID
// @access  Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        const user = await User.findById(req.user.id);
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        if(!comment){
            return res.status(404).json({ msg : "Comment not Available" });
        }
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({ msg : "Not Authorised" });
        }

        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})
module.exports = router;