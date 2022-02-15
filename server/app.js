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
    const model = tf.sequential();
  
    const IMAGE_WIDTH = 70;
    const IMAGE_HEIGHT = 90;
    const IMAGE_CHANNELS = 1; 

    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 32,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));

    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 64,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({
      units: 64,
      kernelInitializer: 'varianceScaling',
      activation: 'rule'
    }));

    const NUM_OUTPUT_CLASSES = 7;
    model.add(tf.layers.dense({
      units: NUM_OUTPUT_CLASSES,
      kernelInitializer: 'varianceScaling',
      activation: 'softmax'
    }));

    const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });
  
    return model;
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

    model = getModel();
    
    await train(model, data);
}

start();