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
      });
      Users.findById(req.body.userId,function(err,data){
        if(err){console.log(err)};
        console.log(data);
        const description = data.exercises[data.exercises.length-1].description;
        const duration = data.exercises[data.exercises.length-1].duration;
        const date = data.exercises[data.exercises.length-1].date;
        res.json({_id: data._id, username: data.username, description: description, duration: duration, date: date});
      });
    });
  });

  app.get('/api/exercise/log',function(req,res){
    Users.findById(req.query.userId || 0,function(err,data){
      if(err){
        res.json("User not found or incorrect ID value");
      }else{
        const fromDateUnix = Date.parse(new Date(req.query.from)) || 1;
        const toDateUnix = Date.parse(new Date(req.query.to)) || Date.parse(new Date());
        let exercisesSelected = data.exercises.filter(function(a){return (Date.parse(new Date(a.date)) >= fromDateUnix && Date.parse(new Date(a.date)) <= toDateUnix) || (!a.hasOwnProperty('date'))}).slice(0,req.query.limit || 999999);
        console.log(exercisesSelected)
        for(const i in exercisesSelected){
          exercisesSelected[Number(i)] = {description: exercisesSelected[Number(i)].description, duration: exercisesSelected[Number(i)].duration, date: exercisesSelected[Number(i)].date};
        };
        res.json({_id: data._id, username: data.username, count: data.exercises.length , log: exercisesSelected});
      }
    });
  })

  app.use(express.static('public'));
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });

  const listener = app.listen(process.env.PORT, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
});
