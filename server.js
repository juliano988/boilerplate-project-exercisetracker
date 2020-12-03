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
    exercises: [{description: String , duration: Number , date: String}]
  });
  const Users = mongoose.model('Users', usersSchema);

  app.post('/api/exercise/new-user', function (req, res) {
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
      let exercises = data.exercises;
      exercises.push({description: req.body.description , duration: Number(req.body.duration) , date: req.body.date});
      Users.findByIdAndUpdate(req.body.userId,{
        exercises: exercises
      },function(err,data){
        if(err){return console.log(err)};
        // console.log(data)
        // res.json({_id: data._id , username: data.username , date: req.body.date , duration: req.body.duration , description: req.body.description});
      });
      Users.findById(req.body.userId,function(err,data){
        if(err){console.log(err)};
        console.log(data);
        const description = data.exercises[data.exercises.length-1].description;
        const duration = data.exercises[data.exercises.length-1].duration;
        const date = data.exercises[data.exercises.length-1].date;
        res.json({_id: data._id, username: data.username, description: description, duration: duration, date: date});
      })
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
