import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required'],
      },
      last_name: {
        type: String,
      },
      username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
      },
      interests: {
        type: String,
      },
      work_area: {
        type: String,
      },
    }, {
      timestamps: true,
})
const User = mongoose.model('User', userSchema);
export default User;