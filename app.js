const express = require('express')
const app = express()
const ejs = require('ejs')
const bodyparser = require('body-parser')
const md5 = require('md5')
const session = require('express-session')
var morgan = require('morgan')
const mongoose = require('mongoose')
const slugify = require('@sindresorhus/slugify');
const path = require('path')
const fs = require('fs')

const t = require('./lib/tools.js')
require('dotenv').config() //process.env.
const {
   Blog,
   User,
   Category,
   UTM,
} = require('./models/blogs')

app.set('view engine', 'ejs')
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/timeago', express.static(__dirname + '/node_modules/timeago.js/dist'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/css')));


// app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

const dbURL = "mongodb+srv://" + process.env.DBUSERNAME + ":" + process.env.DBUSERPASS + "@cluster0.k4rvg.mongodb.net/" + process.env.DBNAME + "?retryWrites=true&w=majority"

var db = mongoose.connect(dbURL, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useFindAndModify: false,
   useCreateIndex: true
})
   .then((result) => {
      console.log('connected to db');
   })
   .catch((err) => {
      console.log('db error')
   })
app.use(bodyparser.urlencoded({
   extended: false
}))

app.use(session({
   secret: 'secret key',
   resave: false,
   saveUninitialized: true
}));


app.get('/404', (req, res) => {
   res.render('404');
})
var sitename = 'devkaan blogsite'
app.route('/from/:adress')
   .get((req, res) => {
      res.redirect('/')
   })
   .post((req, res) => {

      try {
         adress = req.params.adress
      } catch (error) {
         adress = null
         console.log(error);
      }
      console.log(adress);
      if (adress) {
         let utm = new UTM({
            fromwhere: adress,
            whichsite: sitename
         }).save(result => {
            console.log('78 =>', result);
            if (result) {
               res.json({ status: 1 })
            }
            else { res.json({ status: 2, message: 'utm_source could not added' }) }
         })
      }
   })
app.get('/', (req, res) => {
   Blog.find().sort({
      updatedAt: -1
   }).limit(5)
      .then((result) => {
         // index.ejs
         date = []
         let dateMode = 4
         for (let i = 0; i < result.length; i++) {
            mdate = result[i].createdAt
            mupdatedate = result[i].updatedAt
            date.push(t.formatDate(mupdatedate, 'fulldate') + " / " + t.formatDate(mupdatedate, 'timeago'))
         }
         articles = []
         // limit = 700
         // for (let i = 0; i < result.length; i++) {
         //    try {
         //       if (result[i].article !== undefined && result[i].article !== null && result[i].article != '') {
         //          if (result[i].article.length > limit) {
         //             marticle = result[i].article.substring(0, limit) + "..";
         //             articles.push(marticle)
         //          }
         //       }
         //    } catch (error) {
         //       res.send('Limit the paragraph error. exitcode: 10')
         //    }

         // }
         res.render('index', {
            data: result,
            date: date,
            isLogged: t.checkAuthority(req.session.authority)
         });
      })
      .catch((error) => {
         console.log(error)
      })
})

app.route('/sitemap')
   .get((req, res) => {
      res.sendFile(__dirname + '/sitemap.xml')
   })

app.route('/signup')
   .get((req, res) => {
      res.render('signup')
   })
   .post((req, res) => {
      authority = 1;
      username = req.body.username || null;
      userpass = md5(req.body.userpass) || null;
      fullname = req.body.fullname.trim() || null;
      email = req.body.email.trim() || null;
      try {
         var patt = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
         var email = patt.exec(email)[0];

      } catch (error) {
         res.render('signup', { message: 'email', status: 'danger' })
      }
      if (!username) res.render('signup', { message: 'username', status: 'danger' })
      else if (!userpass) res.render('signup', { message: 'userpass', status: 'danger' })
      else if (!fullname) res.render('signup', { message: 'fullname', status: 'danger' })
      else {
         const user = new User({
            authority,
            username,
            userpass,
            fullname,
            email,
         })
            .save()
            .then(result => {
               if (!result) {
                  res.render('signup', {
                     message: 'user could not added, try again',
                     status: 'danger'
                  })
               }
               else {
                  res.render('signin', {
                     message: 'successfuly signed up',
                     status: 'success',
                  })
               }
            })
            .catch((error) => {
               if (error.code == 11000) {
                  res.render('signup', {
                     message: 'username is exist try another one',
                     status: 'danger'
                  })
               }
            })
      }
   })
app.route('/addcat')
   .get((req, res) => {
      if (!req.session.username) {
         res.render('error')
      }
      if (!t.checkAuthority(req.session.authority)) {
         res.render('error')
      }
      else {
         Category.find().then((categories) => {
            if (categories.length > 0) {
               res.render('addcategory', {
                  categories: categories
               })
            }
            else {
               res.render('addcategory', {
                  message: 'There is not category',
                  status: 'warning'
               })
            }
         })
            .catch((error) => {
               res.render('addcategory', {
                  message: 'Categories could not get',
                  status: 'danger'
               })
            })
      }

   })
   .post((req, res) => {
      if (!req.session.username) {
         res.render('error')
      }
      if (!t.checkAuthority(req.session.authority)) {
         res.render('error')
      }
      catname = String(req.body.catname)
      Category.find().then((result) => {
         catobj = {
            catid: result.length,
            catname: catname
         }
         const cat = new Category(catobj)
            .save()
            .then((result) => {
               Category.find().then((categories) => {
                  if (categories.length > 0) {
                     res.render('addcategory', {
                        message: 'Category successfuly added',
                        status: 'success',
                        categories: categories
                     })
                  }
                  else {
                     res.render('addcategory', {
                        message: 'There is not category',
                        status: 'warning'
                     })
                  }
               })
                  .catch((error) => {
                     res.render('addcategory', {
                        message: 'Categories could not get',
                        status: 'danger'
                     })
                  })
            })
            .catch((error) => {
               res.render('addcategory', { message: error, status: 'danger' })
            })
      })


   })
app.route('/adduser')
   .get((req, res) => {
      if (!req.session.username) {
         res.render('error')
      }
      else if (!t.checkAuthority(req.session.authority)) {
         res.render('error')
      }
      else {
         User.find()
            .then(users => {
               res.render('adduser', {
                  message: 'Welcome',
                  status: 'success',
                  users: users
               })
            })
            .catch(err => {
               if (err) throw err
            })
      }
   })
   .post((req, res) => {
      if (!req.session.username) {
         res.render('error')
      }
      if (!t.checkAuthority(req.session.authority)) {
         res.render('error')
      }
      else {
         authority = req.body.authority || null;
         username = req.body.username || null;
         userpass = md5(req.body.userpass) || null;
         fullname = req.body.fullname.trim() || null;
         email = req.body.email.trim() || null;
         try {
            var patt = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            var email = patt.exec(email)[0];

         } catch (error) {
            res.render('adduser', { message: 'email', status: 'danger' })
         }
         if (!authority) res.render('adduser', { message: 'authority', status: 'danger' })
         else if (!username) res.render('adduser', { message: 'username', status: 'danger' })
         else if (!userpass) res.render('adduser', { message: 'userpass', status: 'danger' })
         else if (!fullname) res.render('adduser', { message: 'fullname', status: 'danger' })
         else {
            const user = new User({
               authority,
               username,
               userpass,
               fullname,
               email,
            })
               .save()
               .then(result => {
                  if (!result) {
                     res.render('adduser', {
                        message: 'user could not added, try again',
                        status: 'danger'
                     })
                  }
                  else {
                     User.find()
                        .then(users => {
                           res.render('adduser', {
                              message: 'successfuly added',
                              status: 'success',
                              users: users
                           })
                        })
                        .catch(err => {
                           if (err) throw err
                        })
                  }
               })
               .catch((error) => {
                  res.render('adduser', {
                     message: 'there is an error adding user. try again',
                     status: 'danger'
                  })
               })
         }
      }
   })
const handleError = (err, res) => {
   res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
};

app.get('/login', (req, res) => {
   if (req.session.username) {
      res.redirect('/addtext')
   }
   else {
      res.render('signin');
   }
})

app.post('/login', (req, res) => {
   var username = req.body.username
   var userpass = md5(req.body.userpass)
   if (username == '') {
      res.render('signin', {
         message: 'you should write your username',
         status: undefined
      })
   } else if (userpass == '') {
      res.render('signin', {
         message: 'you should write your password too',
         status: undefined
      })
   } else {
      User.find({
         username: username,
         userpass: userpass
      }, (error, result) => {
         result = result[0]
         if (result === undefined) {
            res.render('signin', {
               message: 'username or password is wrong',
               status: 'danger'
            })
         } else {
            req.session.userid = result._id;
            req.session.authority = result.authority;
            req.session.username = result.username;
            req.session.email = result.email;
            req.session.fullname = result.fullname;
            res.redirect('/addtext')
         }
      })
   }
})

app.get('/posts', (req, res) => {
   res.redirect('/')
})

app.get('/posts/:posturl', (req, res) => {
   Blog.findOne({
      url: req.params.posturl
   })
      .then((result) => {
         if (result) {
            pathname = 'public/posts/'
            fullpathname = pathname + result.url + ".json"
            var postFolder = fs.existsSync('public/posts')
            if (!postFolder) {
               // posts folder is not exist and will create
               fs.mkdir(pathname, (err) => {
                  if (err) res.send('create folder error')
               })
            }
            else {
               // posts folder is exist
               isfileexist = fs.existsSync(fullpathname);
               if (isfileexist) {
                  fs.readFile(fullpathname, (err, data) => {
                     if (err) throw err;
                     mdata = JSON.parse(data)
                     likes = mdata.likes.like
                     comments = mdata.comments;
                     Cdate = new Date(mdata.createdAt);
                     Udate = new Date(mdata.updatedAt);
                     Mdate = t.formatDate(Cdate, 'fulldate') + " Güncelleme: " + t.formatDate(Udate, 'fulldate') + " " + t.formatDate(Udate, 'timeago')

                     // isliked control
                     liked = false
                     wholiked = mdata.likes.wholiked
                     if (wholiked.length > 0) {
                        isliked = wholiked.indexOf(req.session.username)
                        if (isliked > -1) {
                           // already liked
                           liked = true
                        }
                     }

                     res.render('posts', {
                        data: result,
                        likes: JSON.stringify(likes),
                        isliked: liked,
                        comments: JSON.stringify(comments),
                        date: Mdate,
                        isLogged: t.checkAuthority(req.session.authority)
                     })
                  })
               }
               else {
                  // .json file is not exist
                  console.log('.json file is not exist');
                  res.render('posts', {
                     data: result,
                     likes: null,
                     comments: null,
                     date: null,
                     isLogged: t.checkAuthority(req.session.authority)
                  })
               }
            }
         }
         else {
            res.redirect('/404')
         }
      })
      .catch((error) => {
         console.log(error)
      })
})


app.route('/addtext')
   .get((req, res) => {
      if (req.session.username !== undefined && req.session.username !== null && req.session.username != '') {
         Category.find()
            .then((result) => {
               res.render('addtext', {
                  categories: result
               })
            })
            .catch((error) => {
               res.send('/addtext GET catch error')
            })
      } else {
         req.session.destroy()
         res.redirect('/login')
      }
   })
   .post((req, res) => {
      if (req.session.userid === undefined) {
         res.redirect('/login')
      } else {
         thumburl = null
         videourl = req.body.videourl.trim() || null
         title = req.body.title;
         article = req.body.article || null
         fullname = req.session.fullname;
         category = req.body.category || null
         url = slugify(title)
         try {
            var patt = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})?$/;
            var videourl = patt.exec(videourl)[0];
            videourl = videourl.replace('watch?v=', 'embed/')

         } catch (error) {
            videourl = null;
         }
         if (title === '') {
            Category.find()
               .then((categories) => {
                  res.render('addtext', {
                     message: 'you should write an title',
                     status: 'danger',
                     categories: categories,
                     videourl,
                     article,
                  })
               })
               .catch((error) => {
                  res.send('Categories is not found. exitcode: 001')
               })

         } else if (category == 0) {
            Category.find()
               .then((categories) => {
                  res.render('addtext', {
                     message: 'you should choose a category',
                     status: 'danger',
                     categories: categories,
                     title,
                     videourl,
                     article,
                  })
               })
               .catch((error) => {
                  res.send('Categories is not found. exitcode: 002')
               })
         } else {
            Blog.find({
               url: url
            })
               .then((result) => {
                  if (result.length > 0) {
                     filter = {
                        url: url,
                     }
                     update = {
                        thumburl: thumburl,
                        videourl: videourl,
                        url: url,
                        title: title,
                        article: article,
                        category: category,
                        author: fullname,
                        like: 0,
                        comments: []
                     }
                     Blog.findOneAndUpdate(filter, update)
                        .then((result) => {
                           res.end(JSON.stringify(result))
                        })
                        .catch((error) => {
                           res.end(error)
                        })

                  } else {
                     const blog = new Blog({
                        thumburl: thumburl,
                        videourl: videourl,
                        url: url,
                        title: title,
                        article: article,
                        category: category,
                        author: fullname,
                     })
                        .save()
                        .then((result) => {
                           pathname = 'public/posts/'
                           fullpathname = pathname + result.url + ".json"
                           var postFolder = fs.existsSync('public/posts')
                           if (!postFolder) {
                              fs.mkdir(pathname, (err) => {
                                 if (err) res.send('create folder error')
                              })
                           }
                           contentObj = {
                              url: url,
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              likes: {
                                 like: 0,
                                 wholiked: []
                              },
                              comments: []
                           }
                           fs.writeFile(fullpathname, JSON.stringify(contentObj), (err) => {
                              if (err) throw err;
                           })
                           res.redirect("/posts/" + result.url)
                        })
                        .catch((error) => {
                           // res.render('404')
                           res.send(error)
                        })
                  }
               })
               .catch((error) => {
                  res.end(error)
               })
         }
      }
   })

app.route('/delete/:url')
   .get((req, res) => {
      if (req.session.username) {
         url = req.params.url;
         Category.find()
            .then((categories) => {
               Blog.deleteOne({ url: url })
                  .then((result) => {
                     var mpath = 'public/posts/' + url + '.json'
                     try {
                        fs.unlink(mpath, (err) => {
                           if (err) res.end('delete error')
                        })
                     } catch (err) {
                        res.send(err)
                     }
                     res.render('addtext', {
                        message: 'successfuly deleted text',
                        status: 'success',
                        categories: categories
                     })
                  })
                  .catch((error) => {
                     res.send('/delete error: <br>')
                  })
            })
            .catch((error) => {
               res.send(error)
            })

      }
      else res.redirect('/login')
   })
   .post((req, res) => {
      res.send('/haha')
   })

app.route('/edit/:url')
   .get((req, res) => {
      if (req.session.username) {
         url = req.params.url
         Category.find()
            .then((categories) => {
               Blog.findOne({ url: url })
                  .then((result) => {
                     res.render('addtext', {
                        categories: categories,
                        title: result.title,
                        url: result.url,
                        article: result.article,
                        videourl: result.videourl,
                        category: result.category,
                        willedit: true
                     })
                  })
                  .catch((error) => {
                     res.send('/edit error: <br>' + error)
                  })
            })
            .catch((error) => {
               console.error(error);
            })
      }
      else res.redirect('/login')
   })
   .post((req, res) => {
      thumburl = null
      videourl = req.body.videourl.trim() || null
      title = req.body.title;
      article = req.body.article || null
      fullname = req.session.fullname;
      category = req.body.category || null
      url = req.params.url
      murl = slugify(title)
      filter = {
         url: url,
      }
      update = {
         thumburl: thumburl,
         videourl: videourl,
         url: murl,
         title: title,
         article: article,
         category: category,
         author: fullname,
      }
      Blog.findOneAndUpdate(filter, update)
         .then((result) => {
            oldPath = 'public/posts/' + result.url + '.json';
            newPath = 'public/posts/' + murl + '.json';
            fs.rename(oldPath, newPath, err => {
               if (err) throw err;
            })
            fs.readFile(newPath, (err, data) => {
               if (err) throw err;
               mdata = JSON.parse(data)
               mdata.url = murl
               mdata.updatedAt = new Date()
               fs.writeFile(newPath, JSON.stringify(mdata), err => {
                  if (err) throw err;
               })
            })
            res.redirect('/posts/' + murl)
         })
         .catch(error => {
            res.end(error)
         })
   })

app.get('/logout', (req, res) => {
   req.session.username = null
   req.session.userid = null
   req.session.destroy();
   res.redirect('/login')
})


let port = process.env.PORT;
if (port == null || port == "") {
   port = 80;
}
app.listen(port, () => {
   console.log('Server working at http://localhost:' + port)
})


// app.route('/addcomment')
//    .get((req, res) => {
//       res.redirect('/')
//    })
//    .post((req, res) => {
//       commentemail = req.body.commentemail.trim() || null;
//       commentname = req.body.commentname.trim() || null;
//       commentmessage = req.body.commentmessage.trim() || null;
//       posturl = req.body.posturl
//       if (!t.validateEmail(commentemail)) {
//          res.redirect(posturl + "?errcode=1")
//       }
//       else if (commentname === undefined || commentname == '' || commentname === null) {
//          res.redirect(posturl + "?errcode=2")
//       }
//       else if (commentmessage === undefined || commentmessage == '' || commentmessage === null) {
//          res.redirect(posturl + "?errcode=3")
//       }
//    })

app.route('/like/:posturl')
   .get((req, res) => {
      res.end('/like wrong method')
   })
   .post((req, res) => {
      if (!req.session.username) {
         res.json({
            status: 0
         })
      }
      else {
         pathname = 'public/posts/'
         fullpathname = pathname + req.params.posturl + ".json"
         var postFolder = fs.existsSync('public/posts')
         if (!postFolder) {
            // posts folder is not exist and will create
            fs.mkdir(pathname, (err) => {
               if (err) res.send('create folder error')
            })
         }
         else {
            // posts folder is exist
            isfileexist = fs.existsSync(fullpathname);
            if (isfileexist) {
               fs.readFile(fullpathname, (err, data) => {
                  if (err) throw err;
                  mdata = JSON.parse(data)
                  likes = mdata.likes.like
                  comments = mdata.comments;
                  try {
                     wholiked = mdata.likes.wholiked
                     if (wholiked.length > 0) {
                        const index = wholiked.indexOf(req.session.username);
                        console.log(req.session.username);
                        console.log(index);
                        if (index > -1) {
                           // already liked
                           mdata.likes.like = mdata.likes.like - 1
                           mdata.likes.wholiked.splice(index, 1);
                           fs.writeFile(fullpathname, JSON.stringify(mdata), err => {
                              if (err) throw err;
                              res.json({
                                 status: 2
                              })
                           })
                        }
                        else {
                           // not liked
                           mdata.likes.like = mdata.likes.like + 1
                           mdata.likes.wholiked.push(req.session.username)
                           fs.writeFile(fullpathname, JSON.stringify(mdata), err => {
                              if (err) throw err;
                              res.json({
                                 status: 1
                              })
                           })
                        }

                     }
                     else {
                        mdata.likes.like = mdata.likes.like + 1
                        mdata.likes.wholiked.push(req.session.username)
                        fs.writeFile(fullpathname, JSON.stringify(mdata), err => {
                           if (err) throw err;
                           res.json({
                              status: 1
                           })
                        })
                     }

                  } catch (likeerror) {
                     if (likeerror) throw likeerror
                     console.log('likeerror');
                  }
               })
            }
            else {
               res.render('posts', {
                  data: [],
                  date: null,
                  isLogged: t.checkAuthority(req.session.authority)
               })
            }
         }
      }
   })
app.route('/comment/:posturl')
   .get((req, res) => {
      res.redirect('/')
   })
   .post((req, res) => {
      email = req.body.email.trim() || null;
      try {
         var patt = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
         var email = patt.exec(email)[0];
      } catch (error) {
         res.render('adduser', { message: 'email', status: 'danger' })
      }
      if (req.session.username) {
         url = req.params.posturl
         email = req.body.email.trim() || req.session.email
         article = req.body.article.trim() || ''
         pathname = 'public/posts/'
         fullpathname = pathname + req.params.posturl + ".json"
         var postFolder = fs.existsSync('public/posts')
         if (!postFolder) {
            // posts folder is not exist and will create
            fs.mkdir(pathname, (err) => {
               if (err) res.send('create folder error')
            })
         }
         else {
            // posts folder is exist
            isfileexist = fs.existsSync(fullpathname);
            if (isfileexist) {
               fs.readFile(fullpathname, (err, data) => {
                  if (err) throw err;
                  mdata = JSON.parse(data)
                  comm_obj = {
                     comm_username: req.session.username,
                     comm_name: req.session.fullname,
                     comm_email: email,
                     comm_article: article,
                     comm_createdAt: new Date(),
                     comm_updatedAt: new Date()
                  }
                  mdata.comments.push(comm_obj)
                  fs.writeFile(fullpathname, JSON.stringify(mdata), err => {
                     if (err) throw err;
                  })
                  res.json({
                     status: 1
                  })
               })
            }
            else {
               res.render('posts', {
                  data: [],
                  date: null,
                  isLogged: t.checkAuthority(req.session.authority)
               })
            }
         }
      }
      else {
         res.json({
            status: 0
         })
      }
   })


// 404 page. it works
app.use(function (req, res, next) {
   var err = new Error('Not Found');
   err.status = 404;
   res.render('404')
});
