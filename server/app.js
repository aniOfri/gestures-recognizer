const {readdir} = require('fs/promises');
const tf =require('@tensorflow/tfjs-node');

const getPixels = require("get-pixels")

const express = require('express')
const app = express()
const bodyParser = require('body-parser') 
const cors = require('cors');

const PORT = 3000
const IMAGE_WIDTH = 50;
const IMAGE_HEIGHT = 50;
const IMAGE_CHANNELS = 1; 
const NUM_OUTPUT_CLASSES = 5;
const LABELS = ["five fingers", "fist", "L shape", "O shape","V shape"]

var model;
var loaded = false;
var TRAINBATCH = 0;
var TESTBATCH = 0;

app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors()); 

app.post('/request', async (req, res) =>{;
    if (loaded){
        var data = req.body.dataUrl;

        await getPixels(data, async function(err, pixels) { 
            if (err){
                console.log(err)
                return
            }

            var pixels = Array.from(pixels.data);
            array = [];
            for (let j = 0; j < IMAGE_WIDTH*IMAGE_HEIGHT*4; j+=4){
                let value = (pixels[j]+pixels[j+1]+pixels[j+2]+pixels[j+3])/4 < 100 ? 1 : 0;
                array.push(value);
            }
    
            const testData = normalizeData(1, [[0, array]])
            const testxs = testData.xs.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
            const preds = model.predict(testxs);
    
            var pred = await preds.data();
            var results = [];
            for (let i = 0; i < NUM_OUTPUT_CLASSES; i++)
                results.push(pred[i].toFixed(3));
    
            res.status(200).send({response: results});
        });
    }
    res.status(404);
})

function printProgress(prefix, progress){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(prefix + progress.toFixed(0) + '%');
    if (progress == 100)
        console.log();
}

// ONE FOLDER OF DATASET
async function getDataUnsplit(){
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    const PATH = "./data/";
    
    var data = [];
    for (let label of LABELS){
        prefix = "Getting DATA of "+label+"...  "
        const files_names = await readdir(PATH+label);
        for (let i = 0; i < files_names.length; i++){
            printProgress(prefix, (i/files_names.length)*100);
            TRAINBATCH++;
            let file_path = PATH+label+"/"+files_names[i];
            let array = []
            getPixels(file_path, function(err, pixels) {    
                if (err){
                    console.log(err)
                    return
                }
                var pixels = Array.from(pixels.data);
                for (let j = 0; j < IMAGE_WIDTH*IMAGE_HEIGHT*4; j+=4){
                    let value = (pixels[j]+pixels[j+1]+pixels[j+2])/3
                    array.push(value);
                }
                //console.dir(array, {'maxArrayLength': null});
            });
            await delay(1)
            data.push([label, array]);
        }
    }
    let split = TRAINBATCH*(3/4);
    TESTBATCH = split % 2 == 0 ? TRAINBATCH-split : Math.floor(TRAINBATCH-split);
    TRAINBATCH = split % 2 == 0 ? split : Math.floor(split);

    console.log(TRAINBATCH, TESTBATCH)

    data = shuffleArray(data);

    let train_data = data.splice(0, TRAINBATCH);
    let test_data = data;
    console.log(train_data.length, test_data.length)

    return [train_data, test_data];
}

// TWO FOLDERS OF DATASETS (TRAIN AND TEST)
async function getDataSplit(){
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    const TRAINING = "./data/";
    const TEST = "./data/";
    
    var train_data = [];
    for (let label of LABELS){
        prefix = "Getting TRAINING DATA of "+label+"...  "
        const files_names = await readdir(TRAINING+label);
        for (let i = 0; i < Math.round(files_names.length*(3/4)); i++){
            printProgress(prefix, (i/Math.round(files_names.length*(3/4)))*100);
            TRAINBATCH++;
            let file_path = TRAINING+label+"/"+files_names[i];
            let array = []
            getPixels(file_path, function(err, pixels) {    
                if (err){
                    console.log(err)
                    return
                }
                var pixels = Array.from(pixels.data);
                for (let j = 0; j < IMAGE_WIDTH*IMAGE_HEIGHT*4; j+=4){
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
        prefix = "Getting TEST DATA of "+label+"...  "
        const files_names = await readdir(TEST+label);
        for (let i = Math.round(files_names.length*(3/4)); i < files_names.length; i++){ 
            printProgress(prefix, ((i-Math.round(files_names.length*(3/4)))/(files_names.length-Math.round(files_names.length*(3/4))))*100); 
            TESTBATCH++;
            let file_path = TEST+label+"/"+files_names[i];
            let array = []
            getPixels(file_path, function(err, pixels) {    
                if (err){
                    console.log(err)
                    return
                }
                var pixels = Array.from(pixels.data);
                for (let j = 0; j < IMAGE_WIDTH*IMAGE_HEIGHT*4; j+=4){
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
    const BATCH_SIZE = TRAINBATCH;
    const TRAIN = TRAINBATCH;
    const TEST = TESTBATCH;

    console.log("Tidying train data..");
    const [trainXs, trainYs] = tf.tidy(()=>{
        const d = normalizeData(TRAIN, data[0]);

        return [
            d.xs.reshape([TRAIN, IMAGE_WIDTH, IMAGE_HEIGHT, 1]),
            d.labels
        ];
    });

    console.log("Tidying test data..");
    const [testXs, testYs] = tf.tidy(()=>{
        const d = normalizeData(TEST, data[1]);

        return [
            d.xs.reshape([TEST, IMAGE_WIDTH, IMAGE_HEIGHT, 1]),
            d.labels
        ];
    });

    console.log("Training starts..")
    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 80,
        shuffle: true
      });
}

function normalizeData(batchSize, data){
    var imagesArray = new Float32Array(batchSize * IMAGE_WIDTH*IMAGE_HEIGHT);
    var labelsArray = new Uint8Array(batchSize * NUM_OUTPUT_CLASSES);

    for (let i = 0; i < batchSize; i++) {
        var image = new Float32Array(data[i][1]);
        output = [0, 0, 0, 0, 0];
        output[LABELS.indexOf(data[i][0])] = 1;
        var label = new Uint8Array(output);

        imagesArray.set(image, i*IMAGE_WIDTH*IMAGE_HEIGHT);
        labelsArray.set(label, i*NUM_OUTPUT_CLASSES);
    }
    
    const xs = tf.tensor2d(imagesArray, [batchSize, IMAGE_WIDTH*IMAGE_HEIGHT]);
    const labels = tf.tensor2d(labelsArray, [batchSize, NUM_OUTPUT_CLASSES]);

    return {xs, labels};
}

async function doPrediction(model, data, batchSize = 500) {
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

const TRAINING = true;
async function start(){
    if (TRAINING){
        console.log("Collecting data..");
        const data = await getDataUnsplit();
        console.log("Data collected.");
    
        console.log("Generating model..");
        model = getModel();
        console.log("Model generated.");
    
        console.log("Training model..")
        await train(model, data);
        console.log("Model trained.")

        await showAccuracy(model, data[0], 50);

        console.log("Saving model..")
        await model.save('file://./my-model');
    }
    else {
        console.log("Loading model.")
        model = await tf.loadLayersModel('file://./my-model/model.json');

        app.listen(PORT, ()=>{
            console.log(`Server is runing on port ${PORT}`)
        })
    }

    loaded = true;
}

start();