    const jwt = require("jsonwebtoken");
    const verifyToken = async (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.status(200).json({ valid: true, payload: decoded });
  } catch (err) {
    console.log(err);
    
    res.status(401).json({ valid: false, error: err.message });
  }
};



module.exports = {verifyToken};
