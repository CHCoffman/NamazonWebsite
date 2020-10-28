const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
    {
        quantity: Number,
        item : {
            type:mongoose.ObjectId, ref:'StoreItem'
        }
    })

const CartItemModel = mongoose.model('CartItem', CartItemSchema);

module.exports = CartItemModel;