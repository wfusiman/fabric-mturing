
import {Injectable } from '@angular/core';
import { settings } from '../models/settings';

declare const go: any;
const $ = go.GraphObject.make;

@Injectable({
    providedIn: 'root'
})
export class DiagramModel {
   
    diagramStates: any;     // Diagrama de estados.
    diagramMachines: any;   // Diagrama de maquinas.

    constructor() {}

    /* Inicializa templates nodes y links del diagrama de estados */ 
    initDiagramStates( divDiagram: string )  {
        this.diagramStates = 
        $(go.Diagram, divDiagram,  
                    { "animationManager.initialAnimationStyle": go.AnimationManager.None,
                    "InitialAnimationStarting": function(e) {
                                                    var animation = e.subject.defaultAnimation;
                                                    animation.easing = go.Animation.EaseOutExpo;
                                                    animation.duration = 900;
                                                    animation.add(e.diagram, 'scale', 0.1, 1);
                                                    animation.add(e.diagram, 'opacity', 0, 1);
                                                },
                    "undoManager.isEnabled": true,
                    positionComputation: function (diagram, pt) {
                                            return new go.Point(Math.floor(pt.x), Math.floor(pt.y));
                                        }
                    }
        );

        var model = $(go.GraphLinksModel);

        // define the Node template
        this.diagramStates.nodeTemplate =
        $(go.Node, "Spot", 
                    { desiredSize: new go.Size(75, 75), 
                      deletable: false }, 
                    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                    $(go.Shape, "Circle",
                                { fill: "#ffffff", /* white */
                                stroke: '#000000',
                                portId: "",
                                fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                                toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false,
                                cursor: "pointer" }, 
                                new go.Binding("fill","color")
                    ),
                    $(go.TextBlock, { font: "bold small-caps 11pt helvetica, bold arial, sans-serif", 
                                    margin: 7, 
                                    stroke: "rgba(0, 0, 0, .87)",
                                  editable: false,  // editing the text automatically updates the model data
                                 textAlign: "center",
                                isMultiline: true,
                                  maxLines: 2 },
                                new go.Binding("text").makeTwoWay())
         );

         // define the Node inicio template
        this.diagramStates.nodeTemplateMap.add( settings.TYPE_STATE_INIT, 
        $(go.Node, "Spot", 
                    { desiredSize: new go.Size(75, 75), 
                      deletable: false }, 
                    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                    $(go.Shape, "Circle",
                                { fill: "#fffd73",  // yellow
                                stroke: "black",
                                portId: "",
                                fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                                toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false,
                                cursor: "pointer" }, 
                                new go.Binding("fill","color" )
                    ),
                    $(go.TextBlock, { font: "bold small-caps 11pt helvetica, bold arial, sans-serif", 
                                    margin: 7, 
                                    stroke: "rgba(0, 0, 0, .87)",
                                    editable: false,  // editing the text automatically updates the model data
                                    textAlign: "center",
                                    isMultiline: true,
                                    maxLines: 2 },
                                    new go.Binding("text").makeTwoWay()
                    )
        ) );

        // define the Node parada template
        this.diagramStates.nodeTemplateMap.add( settings.TYPE_STATE_HALT, 
        $(go.Node, "Spot", 
                { desiredSize: new go.Size(75, 75) , 
                    deletable: false }, 
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Circle",
                            { fill: "#52ce80",  // green
                                stroke: "black",
                                portId: "",
                                fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                                toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false,
                                cursor: "pointer"
                            },
                            new go.Binding("fill","color")
                ),
                $(go.Shape, "Circle", 
                            { fill: null, 
                                desiredSize: new go.Size(65, 65), 
                                strokeWidth: 1, stroke: "black" } 
                ),
                $(go.TextBlock, { font: "bold small-caps 11pt helvetica, bold arial, sans-serif", 
                                margin: 7, 
                                stroke: "rgba(0, 0, 0, .87)",
                                editable: false,  // editing the text automatically updates the model data
                                textAlign: "center",
                                isMultiline: true,
                                maxLines: 2 },
                                new go.Binding("text").makeTwoWay()
                )
         ) );

        // define the Node template maquina template
        this.diagramStates.nodeTemplateMap.add( settings.TYPE_STATE_MACHINE, 
        $(go.Node, "Spot", 
                    { desiredSize: new go.Size(75, 75) , 
                        deletable: false }, 
                    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                    $(go.Shape, "Rectangle",
                                { fill: "orange", 
                                    stroke: "black",
                                    strokeWidth: 2,
                                    portId: "",
                                    fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                                    toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false,
                                    cursor: "pointer"
                                }
                    ),
                    $(go.TextBlock,
                                { font: "bold small-caps 11pt helvetica, bold arial, sans-serif", 
                                margin: 7, 
                                stroke: "rgba(0, 0, 0, .87)",
                                editable: false,  // editing the text automatically updates the model data
                                textAlign: "center",
                                isMultiline: true,
                                maxLines: 2 },
                                new go.Binding("text").makeTwoWay()
                    )
        ) );

        // Define el template para los links entre nodos
        this.diagramStates.linkTemplate =
        $(go.Link, { curve: go.Link.Bezier,
                    adjusting: go.Link.Stretch,
                    reshapable: true, 
                    relinkableFrom: false, 
                    relinkableTo: false,
                    toShortLength: 3, 
                    deletable: false,
                    corner: 20 },
                    new go.Binding("points").makeTwoWay(),
                    new go.Binding("curviness"),
                    $(go.Shape,  { strokeWidth: 1.5 },
                                new go.Binding('stroke', 'progress', function(progress) {
                                                                        return progress ? "#52ce60" /* green */ : 'black';
                                                                    }
                                ),
                                new go.Binding('strokeWidth', 'progress', function(progress) {
                                                                         return progress ? 2.5 : 1.5;
                                                                    }
                                 )
                    ),
                    $(go.Shape,  // the arrowhead
                             { toArrow: "standard", 
                                stroke: null },
                            new go.Binding('fill', 'progress', function(progress) {
                                                                return progress ? "#52ce60" /* green */ : 'black';
                                                            }
                            ),
                    ),
                    $(go.Panel, "Auto",
                                $(go.Shape,  // the label background, which becomes transparent around the edges
                                        { fill: $(go.Brush, "Radial",
                                                            { 0: "rgb(245, 245, 245)", 
                                                            0.7: "rgb(245, 245, 245)", 
                                                            1: "rgba(245, 245, 245, 0)" }
                                                ),
                                        stroke: null }
                                ),
                                $(go.TextBlock, "transicion",  // the label text
                                            { textAlign: "center",
                                                font: "9pt helvetica, arial, sans-serif",
                                                margin: 4, 
                                                editable: false }, // enable in-place editing
                                            new go.Binding("text").makeTwoWay()
                                )
                    )
        );

        this.diagramStates.model = model;
    } 

    /* Agrega un nodo en el diagrama  de estados  */
    addNodeState( key: number, txt: string, locx: number, locy: number ,type: string, group: number ): any {
        let loc_x = (locx) ? locx: 10;
        let loc_y = (locy) ? locy: 10;
        if (this.diagramStates.model.nodeDataArray.length > 0)  {
            let aNode = this.diagramStates.model.nodeDataArray[this.diagramStates.model.nodeDataArray.length-1];
            let locpos = aNode.loc.split( " " );
            loc_x = (locx) ? locx: Number( locpos[0] ) + 150;
            loc_y = (locy) ? locy: Number( locpos[1] ) + 10;
        } 
        let node; 
        if (group == null) {  // Maquina simple
            node = { "key": key, "text": txt, "loc": loc_x + " " + loc_y , "category": type, "isGroup": (type==settings.TYPE_STATE_MACHINE || type==settings.TYPE_STATE_MACHINE_INIT) };
        }
        else { // Maquina compuesta
            node = { "key": key, "text": txt, "loc": loc_x + " " + loc_y , "category": type, "group": group };
        }
        this.diagramStates.model.addNodeData( node ); // agrega nodo al diagrama
        return node;
    }

    /* Elimina un nodo y sus links del diagrama de estados, a partir de su key  */
    delNodeState( key ) {
        let node = this.diagramStates.model.findNodeDataForKey( key );
        this.diagramStates.model.removeNodeData( node );
        this.diagramStates.model.linkDataArray = this.diagramStates.model.linkDataArray.filter( lnk => (lnk.to != key && lnk.from != key) );
    }

    /* Agrega un link entre dos nodos en el diagrama */
    addLinkState( num: number, stateFrom: number, stateTo: number, txt: string ) {
        let linkData = {
            "id": num,
            "from": stateFrom,
            "to": stateTo,
            "text": txt
        }
        this.diagramStates.model.addLinkData( linkData );
    }

    /* Elimina un link a partir de su numero  */
    delLinkState( num: number ) {
        this.diagramStates.model.linkDataArray = this.diagramStates.model.linkDataArray.filter( lnk => lnk.id != num );
    };

    /* Recupera y retorna un nodo del diagrama de estados a partir de su key */
    getNodeState( key: number )  {
        return this.diagramStates.model.findNodeDataForKey( key );
    }

    /* Cambia el color del nodo de acuerdo a si se activa o desactiva */ 
    activateNode( key: number, active: boolean ) {
        let node = this.diagramStates.findNodeForKey( key );
        // Model.commit executes the given function within a transaction
        this.diagramStates.model.commit( function(m) {  // m == the Model
            if (active) 
                m.set( node.data, "color", "orange" ); // orange activado
            else {
                let origin_color = (node.category==settings.TYPE_STATE_INIT) ? '#fffd73' : ((node.category==settings.TYPE_STATE_HALT) ? '#52ce80':'white');
                m.set( node.data, "color", origin_color ); // desactivado
            } 
        }, "change color");
    }


    /* Inicializa templates de nodos y links en el diagrama de maquinas */
    initDiagramMachines( divDiagram: string )  {
        this.diagramMachines = 
        $(go.Diagram, divDiagram, 
                     {"animationManager.initialAnimationStyle": go.AnimationManager.None,
                      "InitialAnimationStarting": function(e) {
                                                    var animation = e.subject.defaultAnimation;
                                                    animation.easing = go.Animation.EaseOutExpo;
                                                    animation.duration = 900;
                                                    animation.add(e.diagram, 'scale', 0.1, 1);
                                                    animation.add(e.diagram, 'opacity', 0, 1);
                                                },
                      "undoManager.isEnabled": true,
                      positionComputation: function (diagram, pt) {
                                            return new go.Point(Math.floor(pt.x), Math.floor(pt.y));
                                        } }
        );
        var model = $(go.GraphLinksModel);

        // define the Node parada template
        let templateParada = 
        $(go.Node, "Spot", 
                { desiredSize: new go.Size(75, 75), 
                deletable: false}, 
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Circle",
                        {   fill: "#52ce80", 
                            stroke: "black",
                            portId: "",
                            fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                            toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false,
                            cursor: "pointer"
                        } ),
                $(go.Shape, "Circle", 
                        {   fill: null, 
                            desiredSize: new go.Size(65, 65), 
                            strokeWidth: 1, 
                            stroke: "black" }),
                $(go.TextBlock,
                            {  font: "bold small-caps 11pt helvetica, bold arial, sans-serif", margin: 7, stroke: "rgba(0, 0, 0, .87)",
                            editable: false,  // editing the text automatically updates the model data
                            textAlign: "center",
                            isMultiline: true,
                            maxLines: 2
                            },
                            new go.Binding("text").makeTwoWay())
        );

        // define the Node template maquina template
        let templateMachine = 
        $(go.Node, "Auto", 
                {desiredSize: new go.Size(75, 75) ,
                 deletable: false, 
                 fromSpot: go.Spot.RightSide,  // coming out from right side
                 toSpot: go.Spot.LeftSide },    // going into at left side 
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Rectangle", 
                            {fill: "white", stroke:"black", strokeWidth:2,
                            fromLinkable: false, fromLinkableSelfNode: false, fromLinkableDuplicates: false, 
                            toLinkable: false, toLinkableSelfNode: false, toLinkableDuplicates: false }),
                $(go.TextBlock, { font: "bold small-caps 11pt helvetica, bold arial, sans-serif", 
                                 stroke: "rgba(0, 0, 0, .87)",
                                 margin: 5,
                                 editable: false,  // editing the text automatically updates the model data
                                 textAlign: "center",
                                 isMultiline: true,
                                maxLines: 2},
                                new go.Binding("text").makeTwoWay() )
        );

         let tempMap = new go.Map();
         tempMap.add( settings.TYPE_STATE_MACHINE, templateMachine );
         tempMap.add( settings.TYPE_STATE_MACHINE_INIT, templateMachine );
         tempMap.add( settings.TYPE_STATE_HALT, templateParada );
        // tempMap.add( "", this.diagramMachines.nodeTemplate );
         this.diagramMachines.nodeTemplateMap = tempMap;
         

        // Define el template para los links entre nodos
        this.diagramMachines.linkTemplate =
        $(go.Link, { routing: go.Link.AvoidsNodes,  // Orthogonal routing
                     corner: 10, // with rounded corners
                     deletable: false,
                     /* fromSpot: go.Spot.Right, toSpot: go.Spot.Left */ },                 
                     new go.Binding("points").makeTwoWay(),
                    $(go.Shape),
                    $(go.Shape, { toArrow: "Standard", stroke: null } ), // The arrowhead
                    $(go.Panel, "Auto",
                                $(go.Shape,  // the label background, which becomes transparent around the edges
                                    { fill: $(go.Brush, "Radial",
                                                    { 0: "rgb(245, 245, 245)", 
                                                    0.1: "rgb(245, 245, 245)", 
                                                    0.2: "rgba(245, 245, 245, 0)" }),
                                      stroke: null }
                                )),
                    $(go.TextBlock, "transicion",  // the label text
                                  { textAlign: "center",
                                    font: "9pt helvetica, arial, sans-serif",
                                    margin: 4, 
                                    editable: false }, // enable in-place editing
                                    new go.Binding("text").makeTwoWay()) // editing the text automatically updates the model data
        );

        this.diagramMachines.model = model;
    }

      /* Agrega un nodo en el diagrama de maquinas, y los nodos de la maquina en el diagrama de estados */
      addNodeMachine( key: number, txt: string, locx: number, locy: number, type: string ): any {
        let loc_x = (locx) ? locx: 10;
        let loc_y = (locy) ? locy: 10;
        if (this.diagramMachines.model.nodeDataArray.length > 0)  {
            let aNode = this.diagramMachines.model.nodeDataArray[this.diagramMachines.model.nodeDataArray.length-1];
            let locpos = aNode.loc.split( " " );
            loc_x = (locx) ? locx: Number( locpos[0] ) + 200;
            loc_y = (locy) ? locy: Number( locpos[1] ) + 10;
        } 
        let node = { "key": key, "text": key + ': \n' + txt, "loc": loc_x + " " + loc_y , "category": type };
        this.diagramMachines.model.addNodeData( node ); // agrega nodo al diagrama de maquinas
        return node;
    }

    /* Elimina un nodo y sus links del diagrama de maquinas, a partir de su key  */
    delNodeMachine( key ) {
        let node = this.diagramMachines.model.findNodeDataForKey( key );
        this.diagramMachines.model.removeNodeData( node );
        this.diagramMachines.model.linkDataArray = this.diagramMachines.model.linkDataArray.filter( lnk => (lnk.to != key && lnk.from != key) );
    }

    /* Inserta link de la transicion en el diagrama de maquinas. */
    addLinkMachine( id: number, stateFrom: number, stateTo: number, txt: string ) {
        this.diagramMachines.model.addLinkData( {"id": id, "from": stateFrom, "to": stateTo, "text": txt } );
    }

    /* Elimina un link del diagrama de maquinas y todos los links correspondientes en el diagrama de estados */
    delLinkMachine( id: number ) {
        this.diagramMachines.model.linkDataArray = this.diagramMachines.model.linkDataArray.filter( lnk => (lnk.id != id ));
        this.diagramStates.model.linkDataArray = this.diagramStates.model.linkDataArray.filter( lnk => (lnk.id < (id * 100) || lnk.id >= (id * 100 + 100)) );
    }

    /* Recupera y retorna un nodo del diagrama a partir de su key */
    getNodeMachine( key: number ) {
        return this.diagramMachines.model.findNodeDataForKey( key );
    }
}