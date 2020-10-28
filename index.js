const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const url = 'mongodb+srv://dbUser:dbUserPassword@projects.kxoe5.mongodb.net/NamazonDB?retryWrites=true&w=majority';
const UserModel = require('./User');
const StoreItemModel = require('./StoreItem');
const CartItemModel = require('./CartItem');
const app = express();
app.use(express.json());
//
const dbName = 'NamazonDB';

// API Key for randommer imports
const config = {
    headers: {
        'X-Api-Key': '7542e71a409f40da97408a0992a9e53e'
    }
}
let database;

// connecting to and initializing database
const initDatabase = async () => {
    database = await mongoose.connect(url);
    if (database) {
        console.log("Successfully connected to my DB");
    } else {
        console.log("error connecting to my DB");
    }
}
initDatabase(); //testing connection
/********************************************************
 * Functions to populate shopping items and users       *
 ********************************************************/

// Generate random users and add them to the array of users
const getNameDataInParallel = async () => {
    const firstNamePromise = axios.get('https://randommer.io/api/Name?nameType=firstname&quantity=20', config);
    const lastNamePromise = axios.get('https://randommer.io/api/Name?nameType=surname&quantity=20', config);
    const users = [];

    let results = await Promise.all([firstNamePromise, lastNamePromise]);

    for (j = 0; j < results[0].data.length; j++) {
        const newUser = {
            name: {
                firstName: results[0].data[j],
                lastName: results[1].data[j]
            },
            cart: [],
            email: results[0].data[j] + results[1].data[j] + "@ex.com"
        };
        for (let i = 0; i < Math.floor(Math.random() * 10); ++i) {
            const item = await StoreItemModel.findOne().skip(Math.floor(Math.random() * 100))
            const quantity = Math.floor(Math.random() * 10);
            const newCartItem = {item, quantity};
            newUser.cart.push(await CartItemModel.create(newCartItem));
        }
        users.push(newUser);
    }
    await UserModel.create(users);
}

// Generate a bunch of random items for the store
const getStoreItems = async () => {
    const storeItems = [];
    const itemResult = await axios.get('https://randommer.io/api/Name/Suggestions?startingWords=item', config);
    itemResult.data.forEach((itemName, index) => {
        let newItem = {
            storeItemName: itemName,
            storeItemQuantity: Math.floor(Math.random() * 10)
        };
        storeItems.push(newItem);
    })
    await StoreItemModel.create(storeItems);
}

// Syncs up functions that populate users and items
const initializeData = async () => {
    await getStoreItems();
    await getNameDataInParallel();
}
//initializeData();

/********************************************************
 * GET functions to return requested information        *
 ********************************************************/
// Get all of the users
app.get('/users', async (req, res) => {
    const foundUsers = await UserModel.find().populate('User');
    res.send(foundUsers);
})

// Get user by ID
app.get('/user/:id', async (req, res) => {
   const reqUserId = await UserModel.findById(req.params.id).populate('cart');
   res.send(reqUserId ? reqUserId : 404);
});

// Get a store item by ID
app.get('/StoreItem/:id', async (req, res) => {
    let reqStoreItemId = await StoreItemModel.find({_id:req.params.id}).populate('StoreItem');

    res.send(reqStoreItemId ? reqStoreItemId : 404);
});

// Get the cart of a specified user
app.get('/user/:UserId/cart', async (req, res) => {
    let foundUser = await UserModel.find({_id:req.params.UserId}).populate('cart');
    res.send(foundUser ? foundUser : 404);
});

// Get a store item regex query of part of the item's name
app.get('/StoreItem', async (req, res) => {
    let foundStoreItem = await StoreItemModel.find({
    storeItemName: new RegExp(req.query.storeItemName)
    }).populate('storeitems');
    res.send(foundStoreItem ? foundStoreItem : 404);
});

/********************************************************
 * POST functions to create new entries                 *
 ********************************************************/

// Create a user using a post THIS WORKS, although no idea about cart
app.post('/user', async(req, res) => {

    const newUser = await UserModel.create(req.body);
    res.send(newUser ? newUser : 500);
})

// Add a new item to specified user's cart TODO fix this
app.post('/cart/:id/cartItem', async (req, res) => {
    const foundUserForItem1 = await UserModel.findById(req.params.id);
    const newcartitem = foundUserForItem1.cart.push(req.body);
    foundUserForItem1.save();
    res.send(newcartitem ? newcartitem : 500);

})

/********************************************************
 * DELETE functions to delete specified entries         *
 ********************************************************/
// Empties specific user's cart
app.delete('/user/:UserId/cart', async(req, res) => {

    const foundUser1 = await UserModel.findById(req.params.UserId).populate('cart');
    const deletedItem = foundUser1.cart.pop() // NOTE: this removes the last element from the cart. Call until cart empty.
    await foundUser1.save();
    res.send(deletedItem ? deletedItem : 404);
});
//Deletes the index of the item in the specified user's cart and sends remaining items back
app.delete('/cart/:UserId/:cartItemId', async (req, res) => {
    const founduser = await UserModel.findById(req.params.UserId).populate('cart');
    const deleteditem = founduser.cart.pull(req.params.cartItemId)
    await founduser.save();
    res.send(deleteditem ? deleteditem : 404); // This is sending what is left in the cart, item was deleted
});

app.listen(3000);