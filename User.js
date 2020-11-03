const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name : {
            firstName: String,
            lastName: String
                },
        login: String,
        password: String,
            cart: [{type:mongoose.ObjectId, ref:'CartItem'}],
            email: String
    })

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;