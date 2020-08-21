/**
 * server.js
 * Servidor backend de la maquina de Turing.
 */

const MachineController = require('./api/controllers/machineController');
const cors = require('cors');

var express = require('express');
var app = express();

/*

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://appuser:fabric-mturing@cluster0.qltdi.mongodb.net/dbmt?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("dbmt").collection("machines");
  // perform actions on the collection object
  client.close();
});


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://<username>:<password>@cluster0.qltdi.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

*/
// Create link to Angular build directory
app.use(express.static( './dist' ));
/*
app.use( '/*', (req,res) => {
    res.sendFile( 'index.html', {root: 'dist'});
});
*/

//var corsOption = {
  //  origin: "http://localhost:4200" // origen coneccion Angular 8.
//};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//app.use( cors( corsOption ) );
app.use( bodyParser.urlencoded( {extended:false} ));
app.use( bodyParser.json() );
app.use( methodOverride() );

var router = express.Router();
router.route('/')
  .get( (req,res) => {
      res.sendFile( 'index.html', {root: 'dist'});
  });

router.route( '/machines')
    .get( MachineController.getMachines )
    .post( MachineController.saveMachine );

router.route( '/simpleMachines')
    .get( MachineController.getSimpleMachines );

router.route( '/machines/:id')
    .get( MachineController.getMachine )
    .put( MachineController.updateMachine )
    .delete( MachineController.removeMachine );

router.route( '/machines/stat/:id')
    .put( MachineController.updateStatusMachine );

app.use( '/api', router );

app.listen( process.env.PORT || 8080, () => {
    console.log('Machine Turing Fabric Restful API serve started in port 8080.... '  );    
} );


