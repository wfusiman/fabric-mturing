/**
 * machineControllerjs
 * Modulo controller que procesa las solicitudes http.
 * 
 */

const fs = require('fs');
const { clear } = require('console');
const fname = './data/data.json';


/**
 * jsonRead: abre y lee un archivo y lo parsea a json.
 * @param {} file 
 * @param {*} cb 
 */
function jsonRead(file, cb ) {
    fs.readFile( file, 'utf8', (err,fileData ) => {
        if (err) 
            return cb && cb(err);
        try {
            const object = JSON.parse( fileData );
            return cb && cb( null, object );
        } catch( err ){
            return cb && cb(err);
        }
    });
}

/**
 * getMachines: recupera del archivo la lista de maquinas y retorna el listado en formato json.
 */
exports.getMachines = (req,res) => {
    jsonRead( fname, (err, machines ) => {
        if(err) {
            console.log( 'Error leyendo archivo: ',err );
            res.status( 500 ).send( err.message );
        }
        res.status(200).jsonp( machines );
    });
};

exports.getSimpleMachines = (req, res) => {
    jsonRead( fname, (err, machines ) => {
        if (err) {
            console.log( 'getSimpleMachines - Error leyendo archivo: ', err );
            res.status( 500 ).send( err.message );
        }
        machines = machines.filter( m => m.type != 'compuesta');
        res.status( 200 ).jsonp( machines );
    });
};

/**
 * getMachine: recupera del archivo una maquina con id especifico y retorna esta en formato json.
 */
exports.getMachine = (req,res) => {
    const id = req.params.id;

    jsonRead( fname, (error, machines ) => {
        if (error) {
            console.log( 'Error leyendo archivo: ', error );
            res.status(500).send( error.message );
        }
        machine = {};
        for(let m of machines) {
            if (m.id == id) {
                machine = m;
                break;
            } 
        }
        res.status(200).jsonp( machine );
    });
} 

/**
 * saveMachine: Agrega una nueva maquina al listado de maquinas en archivo.
 */
exports.saveMachine = (req,res ) => {
    jsonRead( fname, (err, machines) => {
        if (err) {
            console.log( 'Error leyendo archivo: ', err );
            return -1
        }
        if (machines.find( machine => (machine.name === req.body.name))) {
            console.log("nombre ya registrado");
            res.status( 500 ).send('El nombre de la maquina ya se encuentra registrado');
            return;
        }   
        const newId = (machines.length == 0) ? 1: machines[machines.length-1].id + 1; // Id de la nueva maquina.
        const machine = {
            id: newId,
            name: req.body.name ,
            description: req.body.description,
            active: req.body.active,
            alphabet: req.body.alphabet,
            states: req.body.states,
            transitions: req.body.transitions,
            machines: req.body.machines,
            type: req.body.type
        }
        machines.push( machine );
        const jsonString = JSON.stringify( machines,null,2 );
        fs.writeFile( fname, jsonString, err => {
            if (err)  {
                console.log( 'Error de escritura: ', err );
                res.status( 500 ).send( err.message );
            } 
            else {
                console.log( 'Archivo escrito exitosamente...' );
                res.status( 200 ).jsonp( machine );
            }
        });

    });
}

/**
 * updateMachine: actualiza los datos de una maquina especifica en el archivo.
 */
exports.updateMachine = (req, res ) => {
    const id = req.params.id;
    const machineUpdate = req.body;
    jsonRead( fname, (err, machines ) => {
        if(err) {
            console.log( 'Error leyendo archivo: ',err );
            res.status( 500 ).send( err.message );
        }
        if (machines.find( m => (m.name == machineUpdate.name && m.id != id))) {
            console.log( 'maquina update : ' + machineUpdate.name + ', id param: ' + id );
            console.log("nombre ya registrado");
            res.status( 500 ).send('El nombre de la maquina ya se encuentra registrado');
            return;
        }  
        machines = machines.map( maq => { 
            if (maq.id == id)
                maq = machineUpdate;
            return maq;
        });
        const jsonString = JSON.stringify( machines,null,2 );
        fs.writeFile( fname, jsonString, err => {
            if (err)  {
                console.log( 'Error de escritura: ', err );
                res.status( 500 ).send( err.message );
            } 
            else {
                console.log( 'Archivo escrito exitosamente...' );
                res.status( 200 ).jsonp( machineUpdate );
            }
        });
    });
}

exports.updateStatusMachine = ( req,res ) => {
    const id = req.params.id;
    const stat = req.body.active;
    let machine;
    jsonRead( fname, (err, machines ) => {
        if(err) {
            console.log( 'Error leyendo archivo: ',err );
            res.status( 500 ).send( err.message );
        }
        machines = machines.map( maq => { 
            if (maq.id == id) {
                maq.active = stat;
                machine = maq;
            }
            return maq;
        });
        const jsonString = JSON.stringify( machines,null,2 );
        fs.writeFile( fname, jsonString, err => {
            if (err)  {
                console.log( 'Error de escritura: ', err );
                res.status( 500 ).send( err.message );
            } 
            else {
                console.log( 'Archivo escrito exitosamente...' );
                res.status( 200 ).jsonp( machine );
            }
        });
    });

}
/**
 * removeMachine
 */
exports.removeMachine = (req, res) => {
    const id = req.params.id;
    jsonRead( fname, (err, machines ) => {
        if(err) {
            console.log( 'Error leyendo archivo: ',err );
            res.status( 500 ).send( err.message );
        }
        machines = machines.filter( maq => maq.id != id );
        const jsonString = JSON.stringify( machines,null,2 );
        fs.writeFile( fname, jsonString, err => {
            if (err)  {
                console.log( 'Error de escritura: ', err );
                res.status( 500 ).send( err.message );
            } 
            else {
                console.log( 'Eliminando maquina exitosamente...' );
                res.status( 200 ).jsonp( machines );
            }
        });
    });
}