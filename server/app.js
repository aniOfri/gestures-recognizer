const { readdir, readFile }= require('fs/promises');
//const tf =require('@tensorflow/tfjs-node');

var PNG = require('png-js');

/*const express = require('express')
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
})*/

async function getData(){
    const TRAINING = "./dataset/training_set/";
    const TEST = "./dataset/test_set/";
    const LABELS = ["background", "four", "L", "three", "thumbsup", "two", "up"]
    
    train_data = [];
    for (let label of LABELS){
        const files_names = await readdir(TRAINING+label);
        for (let i = 0; i <= 500; i++){
            let file_path = TRAINING+label+"/"+files_names[i];
            await PNG.decode(file_path, function(pixels) {
                var pixels = Array.from(pixels);
                var array = []
                for (let j = 0; j < 90*70*4; j+=4){
                    array.push(pixels[j+3]/255);
                }
                train_data.push([label, array]);
            });
        }
    }
    train_data = shuffleArray(train_data);

    test_data = [];
    for (let label of LABELS){
        const files_names = await readdir(TEST+label);
        for (let i = 0; i < 350; i++){
            let file_path = TEST+label+"/"+files_names[i];
            PNG.decode(file_path, function(pixels) {
                var pixels = Array.from(pixels);
                var array = []
                for (let j = 0; j < 90*70*4; j+=4){
                    array.push(pixels[i+3]/255);
                }
                test_data.push([label, array]);
            });
        }
    }
    test_data = shuffleArray(test_data);

    return [train_data, test_data];
}

function shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
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
    const data = await getData();

    console.log(data);
    //model = getModel();
    
    //await train(model, data);
}

start();