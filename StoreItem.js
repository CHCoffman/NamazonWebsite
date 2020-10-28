const mongoose = require('mongoose');

const StoreItemSchema = new mongoose.Schema(
    {
        storeItemName : String,
        storeItemQuantity : {
            type: Number,
            default: 0
        }
    }
    )

const StoreItemModel = mongoose.model('StoreItem', StoreItemSchema);

module.exports = StoreItemModel;
