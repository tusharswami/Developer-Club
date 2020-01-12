const jwt        = require('jsonwebtoken');
const config     = require('config');

module.exports = function(req, res, next){
    //Get the Token
    const token = req.header("x-auth-token");

    //Check If no token
    if(!token){
        return res.status(200).json({msg : "No Token, Authorization Failed"});
    }

    //Verify Token
    try{
        const decoded = jwt.decode(token, config.get("jwtSecret"));
        req.user = decoded.user;
        next();
    }catch(err){
        return res.status(401).json({ msg: "Invalid Token "});
    }
};


