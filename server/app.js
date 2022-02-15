const fs = require('fs');
const tf =require('@tensorflow/tfjs-node');

const getPixels = require("get-pixels")

const express = require('express')
const app = express()
const bodyParser = require('body-parser') 
const cors = require('cors');

const PORT = 3000
var model;

app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors()); 

app.post('/request', async (req, res) =>{;
})

app.listen(PORT, ()=>{
    console.log(`Server is runing on port ${PORT}`)
})

function getData(){
}

function getModel(){

}

async function train(model, data){

}

function normalizeData(batchSize, data){

}

async function doPrediction(model, data, batchSize = 500) {
    
  }

async function start(){
    const data = getData();

    model = getModel();
    
    await train(model, data);
}

start();