const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NUMOFROWS = 6; // how many numbers should be displayed on the left
const DATESPACE = 23; // the space left to display the dates
const NUMOFFRAMES = 10;
const help = {
    round: function (number){
        // PARENTS: Chart.drawLine() drawText()
        return Math.round(number * 10) / 10;
    },
    calcXPositionOnCanvas: function() {
        // TODO implement this; uses xFactor and shit in both text, line and nums
        
    },
    daysInMonth: function(month, year) {
        return new Date(year, month, 0).getDate();
}};

const NIGHT = {
    lead: "#1d2733"
};
const DAY = {
    lead: "rgb(255, 255, 255)"
};


const SETTINGS = {
    // TODO add the configuration params here
    minmapHeight: 75,
    mainContainerWidth: innerWidth / 2,
    
    minSliderWidth: 100
};

const myMath = {
    // findPrettyMax: function (chart, xStart, xEnd){
    //     if(chart.constructor.name == "Chart" || chart.constructor.name == "lineChart"){
    //         ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
    //     } else if(chart.constructor.name == "barChart") {
    //         ceiling = myMath.findPrettyMaxForBarChart(chart.y, xStart, xEnd);
    //     } else if(chart.constructor.name == "stackedBarChart") {
    //         // uses the sum of all arrays to find initial max
    //         ceiling = myMath.findPrettyMaxForBarChart(chart.getSummedArray(), xStart, xEnd);
    //     } else if(chart.constructor.name == "line2YChart") {
    //         ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
    //     }
        
    //     return ceiling;
    // },
    // findPrettyMaxForLineChart: function (){
    // },
    // findPrettyMaxForBarChart: function(array, xStart, xEnd){
    // },
    findPrettyRoundNum: function(max){
        max *= 1.1; // make it a bit higher so there's some space above
        let currentNumber = NUMOFROWS;
        let index = 0;
        let prettyNum = currentNumber;
        while (currentNumber < max / NUMOFROWS){
            prettyNum = currentNumber;
            if (currentNumber.toString()[0] == ('5')) {
                currentNumber *= 2;
            }else {
                currentNumber *= 5;
            }
        }
        // rounding to the pretty number: divide by it, floor, *
        let rounded = Math.ceil(max / prettyNum) * prettyNum;

        return rounded;
    },
    findMaxInArray: function(array){
        return Math.max(...array);
    },


    addSecondArrayToFirst(array1, array2){
        for (let i = 0; i < array1.length; i++){
            array1[i] += array2[i];
        }
    }
};




let arrayOfCharts = [];
let titleCount = 1;
function initiateCharts(){
    let importData = () => {
        let xmlhttp = new XMLHttpRequest();
        let url = "chart_data.json";
        xmlhttp.responseType = 'json';
        xmlhttp.open('GET', url, true);
        xmlhttp.onload  = function() {
            createCharts(xmlhttp.response);
            putThemeButton();
        };
        xmlhttp.send(null);
    };
    let createCharts = (data) => {
        let title = 1;
        for (let i = 0; i < data.length; i++){
            arrayOfCharts.push(new Chart(data[i], "Graph "+title));
            title++;
        }
    };

    importData();

}

function drawAnimation(parameters, chart, currentOldCeiling, distributedRelationship, currentFrame){
    if (currentFrame <= NUMOFFRAMES) {
        parameters = chart.configureParametersForGraph();

        requestAnimationFrame(function(){
            drawAnimation(parameters, chart, currentOldCeiling,
                          distributedRelationship, currentFrame);
        });
        parameters.ctx.clearRect(0, 0, parameters.xEndPoint, parameters.yEndPoint);

        parameters.ceiling = currentOldCeiling * (1 + distributedRelationship * currentFrame);

        chart.drawLinesForAllActiveArrays(parameters);

        currentFrame += 1;

        // TODO if the desired ceiling is achieved or surpassed - set frame to end
        // let newFutureCeiling = parameters.ceiling;
        // let currentCeiling = parameters.drawingCeiling;
        // //currentFutureCeiling doesn't seem to be needed
        // if(currentCeiling < newFutureCeiling){
        //     currentFrame = NUMOFFRAMES;
        //     console.log("We've hit the new Future ceilin, exiting prematurely");
        // }


        // draw text using old and new ceiling
        chart.drawNumbers(currentOldCeiling, distributedRelationship, currentFrame);
        // chart.drawNumbers(currentOldCeiling * (1+distributedRelationship * NUMOFFRAMES),
        //                   distributedRelationship, currentFrame);
    } else {
        chart.animationActive = false;
        // check if the chart's current ceiling same as local oldceiling
        if (currentOldCeiling != chart.currentCeiling){
            // console.log("THE CEIL HAS SHIFTED");
            parameters.ceiling = chart.currentCeiling;
            chart.animation(parameters);
            // console.log("CURRENT OLD:", currentOldCeiling, "CURRENT:", chart.currentCeiling);
            
        }

    }
};


class DrawingParameters{
    constructor(ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
                xStart, xEnd, ceiling, oldCeiling, xOffset, columnsOnCanvas){
        this.ctx = ctx;
        this.xArray = xArray;
        this.yArray = yArray;
        this.color = color;
        this.yStartPoint = yStartPoint;
        this.yEndPoint = yEndPoint;
        this.xStartPoint = xStartPoint;
        this.xEndPoint = xEndPoint;
        this.xStart = xStart;
        this.xEnd = xEnd;
        this.ceiling = ceiling;
        this.oldCeiling = oldCeiling;
        this.xOffset = xOffset;
        this.columnsOnCanvas = columnsOnCanvas;
        
    }
}

class Chart{
    constructor(data, title){
        // global vars
        this.currentColumnCursor = null; // used to track which part of the info canv to redraw
        this.previousTouchPosition = null; // for tracking finger movement
        this.animationActive = false; // one animation at a time
        this.oldCeiling = 0;


        // dummies TODO
        this.lines = [];

        this.destructureData(data);
        this.createLayout(title);
        this.initialConfiguration();

        this.drawGraphOnMovement();
        this.drawMinimap();
        this.drawNumbers(this.configureParametersForGraph());
        // this.drawHorizontalLine();
        
    }
    destructureData(data){
        // takes the passed data and converts into objects i can easily work with
        let yArrays = [];
        for (let l = 1; l < data["columns"].length; l++){
            data["columns"][l].splice(0, 1);
            yArrays.push(data["columns"][l]);
        }
        for (let y = 0; y < yArrays.length; y++){
            this.lines.push(
                {
                    name: data.names[y],
                    array: yArrays[y],
                    color: data.colors["y" + y],
                    isActive: true,
                    checkboxName: data.names["y" + y]
                }
            );
        }

        this.x = [];
        this.x = data["columns"][0];
        this.x.splice(0, 1);

    }

    
    createLayout(title){
        this.createMainElements(title);
        this.createSlider();
        this.createButtons();
        this.createTooltip();
    }
    findPrettyMax(xStart, xEnd){
        //TODO findPrettyMax should take an array and return a max number

        // recursively call it for all the active arrays


        //find max THEN turn it into a pretty num
        let currentMax = 0;
        let slicedArray;
        let listOfArrays = this.lines;
        for (let i=0; i < listOfArrays.length; i++){
            if (listOfArrays[i].isActive){
                slicedArray = listOfArrays[i]["array"].slice(xStart, xEnd+1);
                currentMax = Math.max(myMath.findMaxInArray(slicedArray), currentMax);
            }
        }
        // turn into pretty
        return myMath.findPrettyRoundNum(currentMax);

    }
    initialConfiguration(){
        // this.calculateCutout();
        this.drawHorizontalLineAboveText();

    }


    createMainElements(title){
        // main div

        this.div = document.createElement("div");
        document.body.appendChild(this.div);
        this.div.className = "main-container";
        if (detectMobile()){
            this.div.style.width = innerWidth + "px";
            this.div.style.left = "0 px";
        } else {
            this.div.style.width = innerWidth * 0.8 + "px";
            // this.div.style.left = "0 px";
        }

        // title
        let titleElem = document.createElement("h1");
        this.div.appendChild(titleElem);
        titleElem.textContent = title;
        // this.title = titleElem;

        // div for canvases
        this.canvases = document.createElement ("div");
        this.div.appendChild(this.canvases);
        this.canvases.className = "canvases-container";

        //graph
        this.graph = document.createElement("canvas");
        this.canvases.appendChild(this.graph);
        this.gCtx = this.graph.getContext("2d");
        this.graph.width = parseInt(this.div.clientWidth);
        // this.graph.width = parseInt(getComputedStyle(this.div).width);

        // this.graph.width = innerWidth - parseInt(getComputedStyle(this.div).marginRight);
        if (detectMobile()){
            this.graph.height = 700;
        } else {
            this.graph.height = 400;
        }

        // canvas for LINES NUMBERS DATES
        this.info = document.createElement("canvas");
        this.canvases.appendChild(this.info);
        this.info.className = "info-canvas";

        this.iCtx = this.info.getContext("2d");
        this.info.width = this.graph.width;
        this.info.height = this.graph.height;

        // canvas for the POPUP
        this.popup = document.createElement("canvas");
        this.canvases.appendChild(this.popup);
        this.popup.className = "info-canvas";

        this.pCtx = this.popup.getContext("2d");
        this.popup.width = this.graph.width;
        this.popup.height = this.graph.height;

        this.popup.addEventListener("mousemove", this.drawPopup.bind(this));



        // container for the minimap and the slider
        this.miniDiv = document.createElement("div");
        this.div.appendChild(this.miniDiv);
        this.miniDiv.className = "minimap-div";

        this.minimap = document.createElement("canvas");
        this.miniDiv.appendChild(this.minimap);
        this.mCtx = this.minimap.getContext("2d");
        this.minimap.width = parseInt(getComputedStyle(this.miniDiv).width);

        // this.minimap.width = innerWidth - (
        //     parseInt(getComputedStyle(this.miniDiv).marginLeft) +
        //         parseInt(getComputedStyle(this.div).marginRight));
        this.minimap.height = parseInt(getComputedStyle(this.miniDiv).height);

    }
    createSlider(){
        this.lSpace = document.createElement("div");
        this.lSpace.id = "left-space";

        this.rSpace = document.createElement("div");
        this.rSpace.id = "right-space";

        this.slider = document.createElement("div");
        this.slider.id = "slider";

        // sizes
        this.lSpace.style.height = this.minimap.height + "px";
        this.slider.style.height = this.minimap.height - 6 + "px";
        this.rSpace.style.height = this.minimap.height + "px";

        this.lSpace.style.left = 0 + "px";
        this.lSpace.style.width = this.minimap.width * 0.7 + "px";

        this.slider.style.left = parseInt(this.lSpace.style.left) +
            parseInt(this.lSpace.style.width) + "px";
        this.slider.style.width = this.minimap.width * 0.3 - 11 + "px";


        this.rSpace.style.left =
            parseInt(this.slider.style.left) +
            parseInt(this.slider.style.width) + 12 + "px";

        this.rSpace.style.width = this.minimap.width -
            parseInt(this.rSpace.style.left) + "px";


        this.miniDiv.appendChild(this.lSpace);
        this.miniDiv.appendChild(this.slider);
        this.miniDiv.appendChild(this.rSpace);

        let moveSliderLeft = (event) => {
            this.moveSlider(event, "left");
        };
        let moveSliderRight = (event) => {
            this.moveSlider(event, "right");
        };
        let moveSliderMiddle = (event) => {
            this.moveSlider(event, "mid");
        };

        let mouseMovement = () => {
            
            let addMovementListener = (moveFunction) => {
                window.addEventListener("mousemove", moveFunction);

                window.addEventListener("mouseup", function (){
                    window.removeEventListener("mousemove", moveFunction);
                });
            };

            this.slider.addEventListener("mousedown", () =>{
                let sliderRect = this.slider.getBoundingClientRect();

                if (window.event.clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.clientX > sliderRect.left +
                           parseInt(getComputedStyle(this.slider).width) - 20){
                    addMovementListener(moveSliderRight);
                } else {
                    addMovementListener(moveSliderMiddle);
                }

            }
                                        );
        };


        // mobile touch support
        let mobileTouch = () => {

            let addMovementListener = (moveFunction) => {
                window.addEventListener("touchmove", moveFunction);

                window.addEventListener("touchend", () =>{
                    window.removeEventListener("touchmove", moveFunction);
                });
            };

            this.slider.addEventListener("touchstart", () =>{
                this.previousTouchPosition = window.event.touches[0].clientX;
                let sliderRect = this.slider.getBoundingClientRect();

                if (window.event.touches[0].clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.touches[0].clientX > sliderRect.left +
                           parseInt(getComputedStyle(this.slider).width) - 20){
                    addMovementListener(moveSliderRight);
                } else {
                    addMovementListener(moveSliderMiddle);
                }

            }
                                        );
        };
        mouseMovement();
        mobileTouch();

        let cursorListener = () => {
            this.configureSlider();
            this.slider.addEventListener("mousemove", (event) => {
                if (event.clientX - this.sliderRect.left < 20){
                    this.slider.style.cursor = "w-resize";
                } else if (event.clientX > this.sliderRect.left + this.sliderWidth){
                    this.slider.style.cursor = "e-resize";
                } else {
                    this.slider.style.cursor = "move";

                }
            }
                                        );
        };
        cursorListener();

    }
    createButtons(){
        
        let buttons = document.createElement("div");
        this.div.appendChild(buttons);
        for(let i = 0; i < this.lines.length; i++){
            let label = document.createElement("label");
            buttons.appendChild(label);
            label.className = "button-container";

            let input = document.createElement("input");
            input.type = "checkbox";
            label.appendChild(input);
            input.checked = true;
            input.addEventListener("click", () => {
                if (input.checked == false){
                    this.justBeenRemoved = this.lines[i]["array"];
                    this.lines[i].isActive = false;
                } else {
                    this.justBeenSelected = this.lines[i]["array"];
                    this.lines[i].isActive = true;
                }
                this.drawGraphOnCheck();
                this.drawMinimap();
            });
            this.lines[i]["checkbox"] = input;

            let checkmark = document.createElement("span");
            label.appendChild(checkmark);
            //put text inside
            let text = document.createElement("p");
            label.appendChild(text);
            text.appendChild(document.createTextNode(this.lines[i].checkboxName));


            checkmark.className = "checkmark";
            // assign the border as the color
            let color = this.lines[i]["color"];
            checkmark.style.border = "2px solid " + color;
            checkmark.style.backgroundColor = color;
            input.addEventListener("change", function () {
                if (this.checked){
                    checkmark.style.backgroundColor = color;
                } else {
                    checkmark.style.backgroundColor = document.body.style.backgroundColor;
                }
            });

        }
        
        let clrDiv = document.createElement("div");
        buttons.appendChild(clrDiv);
        clrDiv.style.clear = "both";
    }
    createTooltip(){
        this.tooltip = document.createElement("div");
        this.div.appendChild(this.tooltip);
        this.tooltip.className = "myTooltip";
        // this.tooltip.style.backgroundColor = DAY.lead;

    }


    calculateCutout () { 
        // TODO gotta calc the columns and the offset
        // the offset is later used by drawgraph to calculate Translate
        let lPoint = parseInt(getComputedStyle(this.slider).left);
        let rPoint = lPoint + parseInt(getComputedStyle(this.slider).width);
        let mColumnWidth = this.minimap.width / this.x.length;

        let sliderColumnStart = Math.floor(lPoint / mColumnWidth);
        let sliderColumnEnd = Math.ceil(rPoint / mColumnWidth);
        let sliderOffset = lPoint - sliderColumnStart * mColumnWidth;
        let numOfVisibleGraphColumns = (rPoint - lPoint) / mColumnWidth;

        // TODO round this float probably
        // offset: difference between the position of slider coords and closest column coords
        // gotta convert that to the graph offset in drawGraph


        let cutout = {
            sliderColumnStart: sliderColumnStart,
            sliderColumnEnd: sliderColumnEnd,
            sliderOffset: sliderOffset,
            numOfVisibleGraphColumns: numOfVisibleGraphColumns
        };
        return cutout;


    }

    moveSlider(event, movement){ // WRAPPER
        event.preventDefault();
        let movementX;

        if (event.type === "touchmove"){ // check if on mobile
            movementX = Math.round(event.touches[0].clientX - this.previousTouchPosition);
            this.previousTouchPosition = event.touches[0].clientX;
        } else {
            movementX = event.movementX;
        }

        // TODO THROTTLE WITH TIMESTAMPS FOR FAST MOVEMENT
        if (movementX != 0){
            this.actuallyMoveSlider(movementX, movement);
        }
        
    }
    actuallyMoveSlider(movementX, movement){
        let sliderStyle = getComputedStyle(this.slider);
        let lSpaceStyle = getComputedStyle(this.lSpace);
        let rSpaceStyle = getComputedStyle(this.rSpace);
        let border = parseInt(sliderStyle.borderRightWidth) * 2;


        let moveMiddle = () => {

            this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";

            this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
            this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";

            this.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";


            if (parseInt(sliderStyle.left) < 0){

                this.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";

                this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
                this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX + "px";
                this.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX + "px";


            }
            if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
                this.minimap.width - border){

                this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";

                this.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";


                this.rSpace.style.left = parseInt(sliderStyle.left) +
                    parseInt(sliderStyle.width) + border  + "px";
                this.rSpace.style.width = this.minimap.width -
                    parseInt(this.rSpace.style.left) + "px";


            }

        };

        let moveLeft = () => {

            this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";

            this.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";
            this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";


            if (parseInt(sliderStyle.left) < 0){ // side of screen

                this.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";

                this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
                this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
            }

            if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

                this.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";

                this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
                this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
            }

        };

        let moveRight = () => {
            this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";

            this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
            this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";


            if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
                this.minimap.width - border){

                this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

                this.rSpace.style.left = parseInt(sliderStyle.left) +
                    parseInt(sliderStyle.width) + border + "px";
                this.rSpace.style.width = this.minimap.width -
                    parseInt(this.rSpace.style.left) + "px";

            }

            if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

                this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

                this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX +  "px";
                this.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX +  "px";
            }
        };

        // checking mouse position on the button
        if (movement == "left"){
            moveLeft();
        } else if (movement == "right"){
            moveRight();
        } else {
            moveMiddle();
        }

        // apply all that shit
        this.drawGraphOnMovement();
        // TODO recalculate the position of the
        this.configureSlider();

    }
    configureSlider(){
        this.sliderRect = this.slider.getBoundingClientRect();
        this.sliderWidth = parseInt(getComputedStyle(this.slider).width);
    }



    drawGraphOnCheck(){
        this.drawGraph();
    }
    drawGraphOnMovement(){
        this.drawDates(this.configureParametersForGraph());
        this.drawGraph();


    }
    
    configureParametersForGraph(){
        let parameters = new DrawingParameters();
        
        let cutout = this.calculateCutout();
        let xStart = cutout.sliderColumnStart;
        let xEnd = cutout.sliderColumnEnd;
        // let initialGraphCeiling = this.findPrettyMax(0, this.x.length); //TODO change to cutout size
        let ceiling = this.findPrettyMax(xStart, xEnd);

        // configuring the offset
        let xOffset = cutout.sliderOffset / this.minimap.width * this.graph.width;
        let numOfCutColumns = cutout.sliderColumnEnd - cutout.sliderColumnStart;
        xOffset = xOffset / numOfCutColumns * this.x.length;

        parameters.ctx = this.gCtx;
        parameters.xArray = this.x;
        parameters.yArray = null;
        parameters.color = null;
        parameters.yStartPoint = 0;
        parameters.yEndPoint = this.graph.height - DATESPACE;
        parameters.xStartPoint = 0;
        parameters.xEndPoint = this.graph.width;
        parameters.xStart = xStart;
        parameters.xEnd = xEnd;
        parameters.ceiling = ceiling;
        // parameters.oldCeiling = ceiling; // TODO make this global
        this.currentCeiling = ceiling;
        parameters.xOffset = xOffset;
        parameters.columnsOnCanvas = cutout.numOfVisibleGraphColumns;

        return parameters;
    }
    drawGraph(){
        let parameters = this.configureParametersForGraph();

        if (this.oldCeiling != parameters.ceiling) { // TODO consider code optimization with drawMinimap
            if (!this.animationActive){

                this.animationActive = true;
                this.animation(parameters);

                this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
            }
            // parameters.oldCeiling = parameters.ceiling;
        } else {
            this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
            this.drawLinesForAllActiveArrays(parameters);
        }
    }
    configureParametersForMinimap(){
        let parameters = new DrawingParameters();
        let initialMinimapCeiling = this.findPrettyMax(0, this.x.length);
        parameters.ctx = this.mCtx;
        parameters.xArray = this.x;
        parameters.yArray = null;
        parameters.color = null;
        parameters.yStartPoint = 0;
        parameters.yEndPoint = this.minimap.height;
        parameters.xStartPoint = 0;
        parameters.xEndPoint = this.minimap.width;
        parameters.xStart = 0;
        parameters.xEnd = this.x.length - 1;
        parameters.ceiling = initialMinimapCeiling;
        parameters.oldCeiling = initialMinimapCeiling;
        parameters.xOffset = null;
        parameters.columnsOnCanvas = this.x.length;
        return parameters;
    }
    drawMinimap(){ // PARENTS: createButtons, launchChart, 
        // TODO optimize ceiling calculations so i don't do them twice with drawGraph
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
        parameters.ceiling = ceiling;
        parameters.xOffset = 0; // mini doesn't need an offset

        // checking if i need to do an animation
        if (parameters.oldCeiling != ceiling) {

            this.animation(parameters);
            parameters.oldCeiling  = ceiling;
        } else {
            this.drawLinesForAllActiveArrays(parameters);
        }

    }

    drawLinesForAllActiveArrays(parameters){
        //takes parameters from drawGraph or drawMinimap and paints all the active lines and stuff
        for (let i=0; i < this.lines.length; i++){
            if (this.lines[i].isActive) {

                parameters.color = this.lines[i]["color"];
                parameters.yArray = this.lines[i]["array"];
                this.drawLine(parameters);
            }
        }
    }
    drawLine({ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
              xStart, xEnd, ceiling, oldCeiling, xOffset, columnsOnCanvas}) {
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        // let cutoutWidth = this.cutoutWidth / this.minimap.width * this.graph.width;
        // if (drawingCeiling){
        //     ceiling = drawingCeiling; //TODO TEMP
        // }

        // width for canvas and the columns which are drawn off the canvas
        // let visibleColumnWidth = areaWidth / columnsOnCanvas; 

        let columnWidth = areaWidth  / columnsOnCanvas; //used to calculate the number of columns on the screen
        let numsPerPixel = areaHeight / ceiling;

        let currentX = xStartPoint - xOffset;
        let currentY = help.round(yArray[xStart] * numsPerPixel) - yStartPoint;

        
        ctx.beginPath();
        // ctx.moveTo(currentX, currentY);
        for (let i = xStart; i < xEnd + 1; i++) {
            currentX = help.round((i - xStart) * columnWidth) - xOffset;
            currentY = yEndPoint - help.round( yArray[i] * numsPerPixel ) - yStartPoint;

            ctx.lineTo(currentX, currentY);
        }
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        ctx.stroke();

    }
    animation(parameters){ 
        // draws lines with given parameters and each time adjusts the ceiling
        // old ceiling
        // RM extra code


        // find a rel instead

        let relationship;
        let distributedRelationship;
        let relationshipDifferece;


        let currentOldCeiling = this.oldCeiling;
        let currentFutureCeiling = parameters.ceiling;
        let currentNumOfFrames = NUMOFFRAMES;
        let calculateVariables = () => {

            relationship = currentOldCeiling / currentFutureCeiling;
            relationshipDifferece = 1 - relationship;
            distributedRelationship = relationshipDifferece / currentNumOfFrames;
        };
        
        calculateVariables();

        // stop the animation and launch a new one
        // after the current animation is over - check if slider ceiling is diff with graph ceiling
        let currentFrame = 1;

        let chart = this;
        drawAnimation(parameters, chart, currentOldCeiling, distributedRelationship, currentFrame);

    }





    drawHorizontalLines(rowHeight){
        // TODO i prolly don't need the parameters object here
	      let drawLines = () =>{
            let x = 0;
            let xEnd = this.graph.width;
	          let y = DATESPACE - 21;
	          for (let i = 0; i < NUMOFROWS; i++){
		            this.iCtx.moveTo(x, y);
		            this.iCtx.lineTo(xEnd, y);
		            y += rowHeight;
	          }
	      };
	      this.iCtx.beginPath();
	      drawLines();

	      this.iCtx.globalAlpha = 0.4;
	      this.iCtx.lineWidth = "2";
	      this.iCtx.strokeStyle = "grey";
        this.iCtx.stroke();
	      this.iCtx.globalAlpha = 1;
    }
    drawHorizontalLineAboveText(){ // above dates
	      this.iCtx.beginPath();
	      this.iCtx.strokeStyle = "grey";
	      this.iCtx.moveTo(0, this.graph.height - DATESPACE + 2);
	      this.iCtx.lineTo(this.graph.width, this.graph.height - DATESPACE + 2);
	      this.iCtx.stroke();
    }
    drawDates({xStart, xEnd, xOffset, xEndPoint, xStartPoint}) {
        // fired on every redraw (for optimization - only fire when slider is moved)
        this.iCtx.clearRect(0, this.graph.height - DATESPACE, this.graph.width, DATESPACE);
        // takes the range start, end
        // better to draw this with each line draw OR use the same formulas
        // TODO make new consts for repetitive formulas, like calc position with offset
        let columnWidth = (xEndPoint - xStartPoint) / (xEnd - xStart);
        
	      let dateSkipCounter = 0;
	      let skipFactor;
	      skipFactor = Math.floor(80 / columnWidth);


        let y = this.graph.height - 5;
        let currentX = 0; 

	      this.iCtx.font = "14px Helvetica"; //font for the numbers
	      this.iCtx.fillStyle = "grey";
        for (let i = xStart; i < xEnd + 1; i++) {
            if (dateSkipCounter == 0) {
                // TODO finish rounding floats
                currentX = help.round((i - xStart) * columnWidth - xOffset);
                let date = new Date(this.x[i]);
                date = MONTHS[date.getMonth()] + ' ' + date.getDate();
                this.iCtx.fillText(date, currentX, y);

                // skipping some of them
                dateSkipCounter = skipFactor;
            } else {
                dateSkipCounter -= 1;
            }
        } 
    }
    drawNumbers(ceiling, distributedRelationship = 0, currentFrame = 1) {
	      // drawing the numbers on the left side
	      let y = this.graph.height - DATESPACE;

        // old ceil is used to calc nums
        // new to calc position
        let opacity = 1 - (1 / currentFrame);

        this.iCtx.clearRect(0, 0, this.graph.width, y);
	      let curNum = 0;
        let rowStep = ceiling / NUMOFROWS;
        let rowHeight = (this.graph.height - DATESPACE) / NUMOFROWS * (1 + distributedRelationship * currentFrame);
        // TODO round floats
        // let numsPerPixel = areaHeight / NUMOFROWS;
        // get the difference between previous and new ceiling
        // use that difference to change LOCAL nums per pixel


        this.iCtx.globalAlpha = opacity;
	      this.iCtx.font = "14px Helvetica"; //font for the numbers
	      this.iCtx.fillStyle = "grey";
	      for (let i=0; i < NUMOFROWS; i++){
		        this.iCtx.fillText(curNum, 20, y - 10);
		        curNum += rowStep;
		        y -= rowHeight;
	      }
        this.iCtx.lineWidth = 1;
        this.drawHorizontalLines(rowHeight);
        this.iCtx.globalAlpha = 1;

    }


    displayTooltip(currentArrayColumn, currentXPos){
        // displaying the tooltip

        //change the contents of the tooltip

        let date;
        date = new Date(this.x[currentArrayColumn]);
        date = DOW[date.getDay()] + ", " + MONTHS[date.getMonth()] + ' ' + date.getDate();
        let color;
        if (getComputedStyle(document.body).backgroundColor == DAY.lead){
            color = NIGHT.lead;
            this.tooltip.style.backgroundColor = DAY.lead;
        } else {
            color = DAY.lead;
            this.tooltip.style.backgroundColor = NIGHT.lead;

        }
        this.tooltip.innerHTML = `<p style="color:${color};">${date}</p>`;

        // show the tooltip at needed location

        // on the right side, if no space - on the left side
        this.tooltip.style.opacity = "1";
        this.tooltip.style.left = currentXPos + 40 + "px";
        this.tooltip.style.top = 70 + "px";
        // if the width of the div is smaller than canvas-divleft

        let width = this.tooltip.clientWidth;

        let left = this.tooltip.offsetLeft;
        if (left > this.graph.width - width) {
            this.tooltip.style.left = currentXPos - (width + 75) + "px";
        }

    };
    drawCircles(convertedYValue, conversionQuotient, currentXPos, currentArrayColumn){
        // drawing the circles for each line based on its configuration
        let number;
        let name;
        let style;
        for (let i in this.lines){
            if (this.lines[i].isActive){
                convertedYValue =
                    this.graph.height - this.lines[i]["array"][currentArrayColumn] *
                    conversionQuotient - DATESPACE;



                this.pCtx.beginPath();
                this.pCtx.arc(currentXPos, convertedYValue,
                              10, 0, Math.PI * 2);
                this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
                this.pCtx.strokeStyle = this.lines[i]["color"];
                this.pCtx.fill();
                this.pCtx.stroke();
                this.pCtx.fillStyle = "black";

                // get the date
                number = this.lines[i]["array"][currentArrayColumn];
                name = this.lines[i]["checkboxName"];
                style = `float:left; margin: 10px; color: ${this.lines[i]["color"]}`;
                this.tooltip.innerHTML +=
                    `<div style="${style}"><p>${number}</p><p>${name}</></div>`;

            }
        }

    };
    drawVerticalLine(currentXPos){
        this.pCtx.beginPath();
        this.pCtx.moveTo(currentXPos, 0);
        this.pCtx.lineTo(currentXPos, this.graph.height - DATESPACE);

        this.pCtx.lineWidth = "2";
        this.pCtx.strokeStyle = "#777";
        this.pCtx.stroke();
    };
    drawPopup({clientX}){
        // gets the current mouse position and prints the appropriate array values
        let parameters = this.configureParametersForGraph();
        let cutout = this.calculateCutout();

        let cutoutSize = cutout.sliderColumnEnd - cutout.sliderColumnStart;
        let columnWidth = this.graph.width / cutout.numOfVisibleGraphColumns;
        let currentGraphColumn = Math.round((clientX - this.graph.getBoundingClientRect().left)  / columnWidth);

        let ceiling = parameters.ceiling;


        let currentArrayColumn = cutout.sliderColumnStart + currentGraphColumn;

        // TODO [#A] where do i get the old ceiling for the popup?
        let conversionQuotient = (this.graph.height - DATESPACE) / ceiling;

        let convertedYValue;

        // TODO optimize this code for offset
        let xOffset = cutout.sliderOffset / this.minimap.width * this.graph.width;
        let numOfCutColumns = cutout.sliderColumnEnd - cutout.sliderColumnStart;
        xOffset = xOffset / numOfCutColumns * this.x.length;

        let currentXPos = currentGraphColumn * columnWidth - xOffset;
        //check if i have shifted columns to know if i should redraw
        // let start = 0;
        // let end = 0;
        // partial redraw
        /*if (this.currentColumnCursor != currentGraphColumn && this.isAnyArrayActive()){
            // change is negate or positive; +1
            let clearFactor; // proportional to the size of the columns
            // the bigger the columnsize - the smaller the number
            clearFactor = Math.round(6 / ((this.columnWidth/80)*10));
            if (clearFactor < 1){
                clearFactor = 1;
            }

            if (currentGraphColumn > this.currentColumnCursor){// RIGHT
                start = (this.currentColumnCursor - clearFactor) * columnWidth;
                end = (currentGraphColumn + clearFactor) * columnWidth;


                this.partialStartCol = this.currentColumnCursor - clearFactor;
                this.partialStartColPrevious = this.partialStartCol;
                this.partialEndCol = currentGraphColumn + clearFactor;
                this.partialStartPx = start;
                this.partialStartPxPrevious = this.partialStartPx;
                this.partialEndPx = end;

            } else { // LEFT
                end = (this.currentColumnCursor + clearFactor) * this.columnWidth;
                start = (currentGraphColumn - clearFactor) * this.columnWidth;

                this.partialEndCol = this.currentColumnCursor + clearFactor;
                this.partialStartCol = currentGraphColumn - clearFactor;
                this.partialStartPx = start;
                this.partialEndPx = end;

            }

            this.currentColumnCursor = currentGraphColumn;
            // TODO partial redraw for tooltip and circles
            this.iCtx.clearRect(0, 0, this.info.width, this.info.height);
            displayTooltip();
            drawHorizontalLine();
            drawCircles();
        } */

        this.currentColumnCursor = currentGraphColumn;
        // TODO clear only what's necessary
        this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
        this.displayTooltip(currentArrayColumn, currentXPos);
        this.drawVerticalLine(currentXPos);
        this.drawCircles(convertedYValue, conversionQuotient, currentXPos, currentArrayColumn);
        // drawNumbers

    }
    isAnyArrayActive(){
        for (let i in this.lines){
            if (this.lines[i].isActive){
                return true;
            };
        }
        return false;
    };
}



function switchTheme(){
    let color;
    if (getComputedStyle(document.body).backgroundColor == DAY.lead){
        color = NIGHT.lead;
    } else {
        color = DAY.lead;
    }

    document.body.style.backgroundColor = color;
    let chart;
    for (let i = 0; i < arrayOfCharts.length; i++){
        chart = arrayOfCharts[i];
        chart.graph.style.backgroundColor = color;
        chart.minimap.style.backgroundColor = color;
        // TODO change title color
        // tooltip color and
        // buttoncolor when unchecked
        // redraw everything upon click
        if (color == DAY.lead){
            chart.div.style.color = NIGHT.lead;
            //chart.tooltip(window.event); // redraw the tooltip

            themeButton.innerHTML = "Switch to Night Mode";
        } else {
            chart.div.style.color = DAY.lead;
            // chart.tooltip(window.event); // redraw the tooltip
            themeButton.innerHTML = "Switch to Day Mode";
        }
        // chart.redraw(); // why did i put it here


    }
}
let themeButton;
function putThemeButton(){
    let buttonContainer = document.createElement("div");
    document.body.appendChild(buttonContainer);
    buttonContainer.id = "switch-container";

    themeButton = document.createElement("span");
    buttonContainer.appendChild(themeButton);
    // themeButton.type = "a";
    themeButton.id = "switch-button";
    themeButton.innerHTML = "Switch to Night Mode";
    themeButton.addEventListener("click", switchTheme);
}



function detectMobile() { 
    if( navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
      ){
        return true;
    }
    else {
        return false;
    }
}

let throttled;
function onResize(){
    // reset canvases (reconfigure their sizes) and redraw
    // add drawMinimap to redraw in this case
    if (!throttled) {
        let chart;
        for (let i = 0; i < arrayOfCharts.length; i++){
            chart = arrayOfCharts[i];
            // adjust and redraw canvases
            // adjust slider
            // chart.graph.style.width = innerWidth / 2 + "px";//- parseInt(getComputedStyle(chart.div).marginRight);
        }
        // switchTheme();
        throttled = true;
        setTimeout(function() {
            throttled = false;
        }, 250);

    } 

}

window.addEventListener("resize", onResize);




// STAGE 2


class lineChart extends Chart{
    constructor(data){
        let title = "LINE + LINE ZOOM";
        super(data, title);
        // importDays(1);
    }
}

class line2YChart extends Chart{
    constructor(data){
        let title = "LINE 2Y + 2Y";
        super(data, title);
    }
}


class barChart extends Chart{
    constructor(data, title){
        super(data, title);
    }

    


    drawBars({ctx, yArray, xStart, xEnd, color, yEndPoint, yStartPoint, barOffset=0, arrayOfOffsets, ceiling, xOffset, columnsOnCanvas, xStartPoint, xEndPoint}){
        // xStart = 0;
        // xEnd = 10;
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        let numOfColumns = xEnd - xStart;
        let columnWidth = areaWidth / columnsOnCanvas;

        let numsPerPixel = areaHeight / ceiling; // TODO won't work with stacked bars


        let currentOffset = arrayOfOffsets[xStart] * numsPerPixel; // for stacked bars
        let currentX = xStartPoint - xOffset;
        let currentY = areaHeight - yArray[xStart] * numsPerPixel - currentOffset;
        let currentYWoff = areaHeight - yArray[xStart] * numsPerPixel;

        // TODO that's the problem, it should return for EVERY column, now it sends only the last one
        // switch to calculating offset in the wrapper (sum of all previous bars)
        // TODO why does it use graph? what about mini
        let fillDistance = areaHeight - DATESPACE - currentY - currentOffset; // on the Y axis
        // num of col
        let fillWidth = areaWidth / columnsOnCanvas - 1; // on the X axis

        ctx.fillStyle = color;
        for (let x = xStart; x < xEnd + 1; x++) {

            currentOffset = arrayOfOffsets[x] * numsPerPixel; //TEMP
            currentY = yEndPoint - help.round( yArray[x] * numsPerPixel )
                - yStartPoint - currentOffset;
            currentX = help.round((x - xStart) * columnWidth) - xOffset;

            fillDistance = areaHeight - currentY - currentOffset; // on the Y axis
            fillWidth = areaWidth / columnsOnCanvas - 1; // on the X axis
            ctx.fillRect(currentX - xOffset, currentY, fillWidth, fillDistance);
            // TODO insert spaces between columns

        }
        // return the calculated stuff for
        // previous bar height (fill distance)


    }
}

class stackedBarChart extends barChart{
    constructor(data){
        let title = "STACKED + STACKED";
        super(data, title);
    }
    destructureData(data){
        super.destructureData(data);
        this.bars = this.lines;
    }

    getSummedArray(xStart=0, xEnd=this.bars[0].length){
        // sums all array into a single array to find the ceiling
        // TODO change for all the active arrays
        let summedArray = [...this.bars[0].array.slice(xStart, xEnd+1)];
        let currentArray;
        for (let i= 1; i < this.bars.length; i++){
            currentArray = this.bars[i].array.slice(xStart, xEnd+1);
            for (let j = 0; j < currentArray.length; j++){
                summedArray[j] += currentArray[j];
            }
        }
        // send the array to find ceil
        // let ceiling = this.findPrettyMax(summedArray, 0, summedArray.length);
        return summedArray;
    }
    findPrettyMax(xStart, xEnd){
        let array = this.getSummedArray(xStart, xEnd);
        // let slicedArray = array.slice(xStart, xEnd);
        return myMath.findPrettyRoundNum(Math.max(...array));
    }
    

    drawGraph(){
        // TODO clearing the canvas should prolly be done in the wrapper using the param ctx
        let parameters = this.configureParametersForGraph();

        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height); 

        this.drawStackedBars(parameters);
    }
    drawMinimap(){
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
        parameters.ceiling = ceiling;
        this.drawStackedBars(parameters);
    }
    drawStackedBars(parameters){ // PARENTS: drawMinimap, drawGraph
        // array, starts at all 0s
        parameters.arrayOfOffsets = []; // to calc the position relative to the prev item in stack
        // create an empty array of offsets
        for (let x = 0; x < this.x.length; x++){
            parameters.arrayOfOffsets.push(0);
        }
        
        // draw a bar and add value to stack for each active array
        for (let b = 0; b < this.bars.length; b++){
            if (this.bars[b].isActive){
                parameters.color = this.bars[b].color;

                parameters.yArray = this.bars[b].array;
                this.drawBars(parameters);
                myMath.addSecondArrayToFirst(parameters.arrayOfOffsets, this.bars[b].array);

            }
        }
    }

}

class singleBarChart extends barChart{
    constructor(data){
        // let title = data["names"]["y0"];
        let title = "BARS + LINES";
        super(data, title);

        // TODO days
        this.days = [];
        importDays(4, this.days);

    }
    destructureData(data){

        this.x = data["columns"][0];
        this.y = data["columns"][1];
        this.x.splice(0, 1);
        this.y.splice(0, 1);
        this.color = data["colors"]["y0"];
    }
    findPrettyMax(xStart, xEnd){
        let array = this.y; // TODO make for cutout
        let slicedArray = array.slice(xStart, xEnd + 1);
        return myMath.findPrettyRoundNum(Math.max(...slicedArray));
    }

    drawGraph(){
        // this.drawBars(this.y, 300, this.x.length, this.color);
        let parameters = this.configureParametersForGraph();

        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawBars(parameters);
    }
    drawMinimap(){
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
        parameters.ceiling = ceiling;
        this.drawBars(parameters);
    }
    drawBars(parameters){
        // wrapper for drawBars at barChart, creates an array of offsets of 0 for compatibility with stacked charts

        parameters.yArray = this.y;
        parameters.color = this.color;

        let arrayOfOffsets = [];
        for (let x = 0; x < this.x.length; x++){
            arrayOfOffsets.push(0);
        }
        parameters.arrayOfOffsets = arrayOfOffsets;
        super.drawBars(parameters);
    }
}



class areaChart extends Chart{
    constructor(data){
        let title = "AREA + AVERAGE PIE";
        super(data, title);
    }
    drawGraph(){
        let parameters = this.configureParametersForGraph();

        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        // this.drawWrapper(parameters);
        this.drawWithAnArea(parameters);
        this.drawGraphWithAPie(parameters);
    }
    drawMinimap(){
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
        this.drawWithAnArea(parameters);
    }
    drawWithAnArea(parameters){
        parameters.floorArray = this.lines[0];// floorArray;
        parameters.roofArray = this.lines[0];
        parameters.color = this.lines[0].color;

        let percentLines = []; //array of arrays TODO really huge floats
        let arrayOfOffsets = [];

        // translating each array into an array of percentages
        // STEP 1: finding the sum of all arrays
        let sumArray = [...this.lines[0].array]; // the first Y TODO consider ACTIVE arrays
        for(let x = 0; x < this.x.length; x++){
            // sum all Y's
            for (let y = 1; y < this.lines.length; y++) {
                sumArray[x] += this.lines[y].array[x];
            }
            // creating array of offsets for drawArea
            arrayOfOffsets.push(1);
        }
        // STEP 2: finding % of each array relative to sum
        // for each Y - divide the sum by that and add to corresponding sumarray
        for (let y = 0; y < this.lines.length; y++) {
            percentLines.push([]);
            for (let x = 0; x < this.x.length; x++){
                percentLines[y].push(1 / sumArray[x] * this.lines[y].array[x]);
            }
        }


        // STEP 3: for every Y - send that Y+corresponding Offset, then add to that offset
        for (let y = 0; y < percentLines.length; y++){
            if (this.lines[y].isActive){
                parameters.arrayOfOffsets = arrayOfOffsets;
                parameters.yArray = percentLines[y];
                parameters.color = this.lines[y].color;
                this.drawArea(parameters);
                
            }
        }
        
    }
    drawGraphWithAPie(parameters){

        // TODO gotta move some shit from drawing with an area
        // sum up each array and find a relatinship and convert that to a percentarr
        let sum;
        let arrayOfSums = [];
        for (let y = 0; y < this.lines.length; y++){
            sum = 0;
            for (let x = 0; x < this.x.length; x++) {
                sum += this.lines[y].array[x];
            }

            arrayOfSums.push(sum);
            
        }

        let sumOfSums = 0; 
        for (let y = 0; y < arrayOfSums.length; y++){
            sumOfSums += arrayOfSums[y];
        }

        let percentPie = []; // each piece as a %
        for (let y = 0; y < arrayOfSums.length; y++){
            percentPie.push(1 / sumOfSums * arrayOfSums[y]);
        }


        let currentPieOffset = 0;
        for (let y = 0; y < percentPie.length; y++){
            
            this.drawPie(percentPie[y], currentPieOffset, this.lines[y].color);
            currentPieOffset += percentPie[y];
            
        }

    }
    drawArea({ctx, arrayOfOffsets, yArray, color, xEndPoint, xStartPoint, ceiling, yEndPoint, yStartPoint, xStart, xEnd}){
        // takes an array of percentages of graph width 
        // use the given percentage and multiply areaHeight by it
        // let yEndPoint = this.graph.height - DATESPACE;
        // let yStartPoint = 0;
        let areaHeight = yEndPoint - yStartPoint;

        // let xStart = 0;
        // let xEnd = this.x.length;
        
        let areaWidth = xEndPoint - xStartPoint;
        let numOfColumns = xEnd - xStart;
        let columnWidth = areaWidth / numOfColumns;

        let numsPerPixel = areaHeight / ceiling;


        let currentY;
        let currentX = 0;

        ctx.beginPath();

        ctx.lineTo(0, areaHeight);
        for (let x = xStart; x < xEnd + 1; x++) {
            // draw a line and add the corresponding offset, then add that line's height to it
            currentY = areaHeight - (arrayOfOffsets[x] + yArray[x] * numsPerPixel) * areaHeight;
            ctx.lineTo(currentX, currentY);

            currentX += columnWidth;



            arrayOfOffsets[x] -= yArray[x];
        }
        ctx.lineTo(this.graph.width, areaHeight);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // in every X iteration add to the array of offsets
        // currentOffset - the areaHeight * percentage of all the previous lines
    }

    drawPie(pieceOfPie, pieOffset, color){
        // takes
        
        // takes a percentage value and starting radian
        // draws an arc based on that
        let ctx = this.gCtx;
        let xPos = this.graph.width / 2;
        let yPos = this.graph.height / 2;
        
        let radius = 150;
        let startAngle = pieOffset * Math.PI * 2;
        let endAngle = startAngle + Math.PI * 2 * pieceOfPie;

        ctx.beginPath();
        ctx.arc(xPos, yPos, radius, startAngle, endAngle);

        // now draw path to center and close path
        ctx.lineTo(xPos, yPos);

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        // ctx.strokeStyle = color;
        // ctx.stroke();

    }
}







//create an xhtml request, load overview
function downloadDays(filename, whereToAppend){
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.responseType = 'json';
    xmlhttp.open('GET', filename, true);
    xmlhttp.onload  = function() {
        if (xmlhttp.response){
            whereToAppend.push(xmlhttp.response);

        }
    };
    xmlhttp.send(null);
}

let arrayOfNewCharts = [];
let chartClasses = {
    1: lineChart,
    2: line2YChart,
    3: stackedBarChart,
    4: singleBarChart,
    5: areaChart
};

function initiateNewCharts(chartNumber){
    let importMainData = () => { // 1
        let xmlhttp = new XMLHttpRequest();
        let url = `data/${chartNumber}/overview.json`;
        xmlhttp.responseType = 'json';
        xmlhttp.open('GET', url, true);
        xmlhttp.onload  = function() {
            createNewCharts(xmlhttp.response);
        };
        xmlhttp.send(null);
    };
    let createNewCharts = (data) => { // 2
        arrayOfNewCharts.push(new chartClasses[chartNumber](data));
    };

    importMainData();
}

let year1 = [[4, 7], [12, 31], 2018]; //start and end months and days
let year2 = [[1, 1], [4, 6], 2019];
let years = [year1, year2];


let filename;
let startMonthOfYear;
let startDayOfYear;
let endMonthOfYear;
let endDayOfYear;
let counter = 0;
function importDays(chartNumber, whereToAppend){
    for (let y = 0; y < years.length; y++){
        startMonthOfYear = years[y][0][0];
        endMonthOfYear = years[y][1][0];
        startDayOfYear = years[y][0][1];
        endDayOfYear = years[y][1][1];
        for (let m = startMonthOfYear; m <= endMonthOfYear; m++){
            let month = m;
            if (month < 10) {month = '0' + month;}
            let folder = `${years[y][2]}-${month}`;


            // if it's the last month of year - apply end day, else max days
            let endDay;
            let startDay;
            if (m == endMonthOfYear){
                endDay = endDayOfYear;
            } else {
                endDay = help.daysInMonth(month, y);
            }
            if (m == startMonthOfYear){
                startDay = startDayOfYear;
            } else {
                startDay = 1;
            }
            // if start month - starts at the start dat, else at 1
            for (let d = startDay; d <= endDay; d++){
                // import each object and append to the array of days which is a
                // if it exists there
                // TODO what if there's no response (no file)
                let day = d;
                if (day < 10) {day = '0' + day;}

                let filename = `data/${chartNumber}/${folder}/${day}.json`;
                // TODO print the imported objects
                downloadDays(filename, whereToAppend);

                // TODO append to the corresponding object and then print all this shit


            }
        }
    }
}
// OLD CHARTS
// initiateCharts();

// initiate each chart; also appends each to arrayOfNewCharts
for (let c = 1; c <= 5; c++) {
    initiateNewCharts(c);
}


