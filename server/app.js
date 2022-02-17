const { readdir, readFile }= require('fs/promises');
const tf =require('@tensorflow/tfjs-node');

//var PNG = require('png-js');
var getPixels = require("get-pixels")

const express = require('express')
const app = express()
const bodyParser = require('body-parser') 
const cors = require('cors');

const PORT = 3000
var model;
var trained = false;

app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors()); 

app.post('/request', async (req, res) =>{;
    if (trained = true){
        var data = req.body.dataUrl;


        await getPixels(data, async function(err, pixels) { 
            if (err){
                console.log(err)
                return
            }

            var pixels = Array.from(pixels.data);
            array = [];
            for (let j = 0; j < 90*70*4; j+=4){
                let value = (pixels[j]+pixels[j+1]+pixels[j+2]+pixels[j+3])/4 < 100 ? 1 : 0;
                array.push(value);
            }

            const testData = normalizeData(1, [[0, array]])
            const testxs = testData.xs.reshape([1, 70, 90, 1]);
            const preds = model.predict(testxs);
    
            var pred = await preds.data();
            var results = [];
            for (let i = 0; i < 7; i++)
                results.push(pred[i].toFixed(3));
    
            res.status(200).send({response: results});
        });
    }
    res.status(404);
})

app.listen(PORT, ()=>{
    console.log(`Server is runing on port ${PORT}`)
})

const LABELS = ["background", "four", "L", "three", "thumbsup", "two", "up"]

async function getData(){
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    const TRAINING = "./dataset/training_set/";
    const TEST = "./dataset/test_set/";
    
    var train_data = [];
    for (let label of LABELS){
        const files_names = await readdir(TRAINING+label);
        for (let i = 0; i <= 500; i++){
            let file_path = TRAINING+label+"/"+files_names[i];
            let array = []
            getPixels(file_path, function(pixels) {    
                var pixels = Array.from(pixels);
                for (let j = 0; j < 90*70*4; j+=4){
                    let value = (pixels[j]+pixels[j+1]+pixels[j+2]+pixels[j+3])/4 < 100 ? 0 : 1;
                    array.push(value);
                }
            });
            await delay(1)
            train_data.push([label, array]);
        }
    }
    train_data = shuffleArray(train_data);

    var test_data = [];
    for (let label of LABELS){
        const files_names = await readdir(TEST+label);
        for (let i = 0; i < 350; i++){
            let file_path = TEST+label+"/"+files_names[i];
            let array = []
            getPixels(file_path, function(pixels) {    
                var pixels = Array.from(pixels);
                for (let j = 0; j < 90*70*4; j+=4){
                    let value = (pixels[j]+pixels[j+1]+pixels[j+2]+pixels[j+3])/4 < 100 ? 0 : 1;
                    array.push(value);
                }
            });
            await delay(1);
            test_data.push([label, array]);
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
      activation: 'relu'
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
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  
    return model;
}

async function train(model, data){
    const BATCH_SIZE = 300;
    const TRAIN = 3000;
    const TEST = 2000;

    console.log("Tidying train data..");
    const [trainXs, trainYs] = tf.tidy(()=>{
        const d = normalizeData(TRAIN, data[0]);

        return [
            d.xs.reshape([TRAIN, 70, 90, 1]),
            d.labels
        ];
    });

    console.log("Tidying test data..");
    const [testXs, testYs] = tf.tidy(()=>{
        const d = normalizeData(TEST, data[1]);

        return [
            d.xs.reshape([TEST, 70, 90, 1]),
            d.labels
        ];
    });

    console.log("Training starts..")
    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 10,
        shuffle: true
      });
}

function normalizeData(batchSize, data){
    var imagesArray = new Float32Array(batchSize * 90*70);
    var labelsArray = new Uint8Array(batchSize * 7);

    for (let i = 0; i < batchSize; i++) {
        var image = new Float32Array(data[i][1]);
        output = [0, 0, 0, 0, 0, 0, 0];
        output[LABELS.indexOf(data[i][0])] = 1;
        var label = new Uint8Array(output);

        imagesArray.set(image, i*90*70);
        labelsArray.set(label, i*7);
    }
    
    const xs = tf.tensor2d(imagesArray, [batchSize, 90*70]);
    const labels = tf.tensor2d(labelsArray, [batchSize, 7]);

    return {xs, labels};
}

async function doPrediction(model, data, batchSize = 500) {
    const IMAGE_WIDTH = 70;
    const IMAGE_HEIGHT = 90;
    const testData = normalizeData(batchSize, data)
    const testxs = testData.xs.reshape([batchSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
    const preds = model.predict(testxs).argMax(-1);

    testxs.dispose();
    return preds;
  }

  async function showAccuracy(model, data, batchSize = 500) {
    const preds = await doPrediction(model, data, batchSize);
    pred = await preds.data();
    for (let i = 0; i < batchSize; i++){
        console.log(pred[i] +" - "+ data[i][0]);
    }
    return
}

async function start(){
    /*console.log("Collecting data..");
    const data = await getData();
    console.log("Data collected.");

    console.log("Generating model..");
    model = getModel();
    console.log("Model generated.");

    console.log("Training model..")
    await train(model, data);
    console.log("Model trained.")*/
    
    console.log("Loading model.")
    model = await tf.loadLayersModel('file://./my-model/model.json');
    trained = true;

    //await showAccuracy(model, data[0], 50);

    //console.log("Saving model..")
    //await model.save('file://./my-model');
}

start();