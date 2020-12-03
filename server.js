const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');


mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // After conecting to db
  app.use(cors());
  app.use(express.json()) // for parsing application/json
  app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

  // Creating schema
  const usersSchema = new mongoose.Schema({
    username: String,
    count: { type: Number, default: 0 },
    log: [{description: String , duration: Number , date: String}]
  });
  const Users = mongoose.model('Users', usersSchema);

  app.post('/api/exercise/new-user', function (req, res) {
    console.log(req.body)
    Users.find({username: req.body.username}).exec(function(err,data){
      if(err){return console.log(err)};
      if(data.length){
        res.json("Username already taken");
      }else{
        const newUser = new Users({
          username: req.body.username,
        });
        newUser.save(function(err,data){
          if(err){return console.log(err)};
          res.json({username: data.username , _id: data._id});
        });
      };
    });
  });

  app.get('/api/exercise/users',function(req,res){
    Users.find({}).select('_id username __v').exec(function(err,data){
      if(err){return console.log(err)};
      res.json(data);
    });
  });

  app.post('/api/exercise/add',function(req,res){
    Users.findById(req.body.userId,function(err,data){
      if(err){return console.log(err)};
      let count = Number(data.count) + 1;
      let log = data.log;
      log.push({description: req.body.description , duration: Number(req.body.duration) , date: req.body.date});
      Users.findByIdAndUpdate(req.body.userId,{
        count: count,
        log: log
      },function(err,data){
        if(err){return console.log(err)};
        res.json({_id: req.body.userId , username: data.username , date: req.body.date , duration: req.body.duration , description: req.body.description});
      });
    });
  });

  app.use(express.static('public'));
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });

  const listener = app.listen(process.env.PORT, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
});
