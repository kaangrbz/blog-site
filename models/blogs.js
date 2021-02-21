const mongoose = require('mongoose')
const Schema = mongoose.Schema

const blogSchema = new Schema({
    thumburl: {
        type: String,
        require: false
    },
    videourl: {
        type: String,
        require: false
    },
    url: {
        type: String,
        require: true
    },
    title: {
        type: String,
        require: true
    },
    article: {
        type: String,
        require: false
    },
    category: {
        type: String,
        require: false,
    },
    author: {
        type: String,
        require: false
    },
}, {
    timestamps: true
})

const Blog = mongoose.model('Blog', blogSchema);

const userSchema = new Schema({
    authority: {
        type: Number,
        require: true
    },
    username: {
        type: String,
        require: true,
        unique: true,
    },
    userpass: {
        type: String,
        require: true,
    },
    fullname: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
    },
}, {
    timestamps: true
})

const User = mongoose.model('User', userSchema);

const categorySchema = new Schema({
    catid: {
        type: Number,
        require: true,
        unique: true
    },
    catname: {
        type: String,
        require: true
    },
}, {
    timestamps: true
})

const Category = mongoose.model('Category', categorySchema);

const utmSchema = new Schema({
    fromwhere: {
        type: String,
        require: true,
        unique: false
    },
    whichsite: {
        type: String,
        require: true
    },
}, {
    timestamps: true
})

const UTM = mongoose.model('UTM', utmSchema);


module.exports = {
    Blog,
    User,
    Category,
    UTM
}