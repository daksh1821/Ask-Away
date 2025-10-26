import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, interests, work_area } = req.body;
    if (!first_name || !last_name || !username || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const emailexists = await User.findOne({ email });
    if (emailexists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const usernameexist = await User.findOne({ username });
    if (usernameexist) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
      interests,
      work_area
    });

    if (newUser) {
      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        message: 'Registration successful!',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const loginUser = async(req,res)=>{
    try {
        const {username, password} = req.body;
        if(!username || ! password){
            return res.status(400).json({message: "Please provide username and password"});
        }
        const user = await User.findOne({username});
        if(user && await bcrypt.compare(password , user.password)){
            const token = jwt.sign({
                userId : user._id,
                username: user.username
            }, process.env.JWT_SECRET, {expiresIn: '1d'});
            res.status(200).json({
                token: token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                },
                message : "Login successfull",
            });
        }
        else{
            res.status(401).json({message: "Invalid username or password"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}