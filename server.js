/* eslint-disable quotes */
'use strict';

//load Environtment Variable from the .env
require('dotenv').config();

//declare Application Dependancies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

//Application Setup
const PORT = process.env.PORT;
const app  = express();
app.use(cors());

//route syntax = app.<operation>('<route>', callback );

//API routes
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', getTrails);
//app.get('/events', eventHandler);


app.get('*', (request, response) => {
  response.status(404).send('Oops, temporarily unavailable');
});



//Helper Functions

function locationHandler(request, response) {
  try{
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
    superagent.get(url)
      .then( data => {
        const geoData = data.body;
        const location = (new Location(request.query.data, geoData));
        response.status(200).send(location);
      });
  }
  catch(error){
    //some function or error message
    errorHandler('Sorry, there is an issue', request, response);
  }
}

function weatherHandler(request, response){
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  // console.log('lat/long', request.query.data.latitude);
  superagent.get(url)
    .then( data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).send(weatherSummaries);
    })
    .catch( () => {
      errorHandler('There is an issue', request, response);
    });
}

function getTrails(request, response){
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.HIKING_API_KEY}`;
  superagent.get(url)
    .then(dataset =>{
      console.log(dataset);
      const trailsData = dataset.body.trails.map(trails =>{
        return new Trail(trails);
      });
      response.status(200).send(trailsData);
    })
    .catch( ()=> {
      errorHandler('Something went wrong', request, response);
    });
}


function errorHandler(error, request, response) {
  response.status(500).send(error);
}

//Constructors
function Location(city, geoData){
  this.search_query = city;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

function Weather(day){
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
}

function Trail(traildata){
  this.name = traildata.name;
  this.location = traildata.location;
  this.length = traildata.length;
  this.stars = traildata.stars;
  this.star_votes = traildata.starVotes;
  this.summary = traildata.summary;
  this.trails_url = traildata.url;
  this.conditions = traildata.conditionStatus;
  this.condition_date = traildata.conditionDate.toString().slice(0,10);
  this.condition_time = traildata.conditionDate.toString().slice(11,19);
}


//Ensure the server is listening for requests
// THIS MUST BE AT THE BOTTOM OF THE FILE!!!!
app.listen(PORT, () => console.log(`The server is up, listening on ${PORT}`));
