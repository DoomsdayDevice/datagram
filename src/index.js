import {
  MONTHS,
  DOW,
  NUMOFROWS,
  pixelRatio,
  DATESPACE,
  NUMOFFRAMES,
  help,
  NIGHT,
  DAY,
  SETTINGS,
  myMath
} from './utils.js';



let arrayOfCharts = [];
let titleCount = 1;
function initiateCharts(){
    let importData = () => {
        let xmlhttp = new XMLHttpRequest();
        let url = "old/chart_data.json";
        xmlhttp.responseType = 'json';
        xmlhttp.open('GET', url, true);
        xmlhttp.onload  = function() {
            createCharts(xmlhttp.response);
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
        this.previousTouchPosition = null; // for tracking finger movement
        this.animationActive = false; // one animation at a time
        this.oldCeiling = 0;
        this.oldMinimapCeiling = 0;
        this.then = Date.now();


        this.lines = [];

        this.destructureData(data);

        this.createLayout(title);
        this.initialConfiguration();

        this.drawGraphOnMovement();
        this.drawMinimap();
        this.drawNumbers(this.configureParametersForGraph().ceiling, 1, NUMOFFRAMES);

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

        document.querySelector(".charts-container").appendChild(this.div);
        this.div.className = "chart";
        if (detectMobile()){
            this.div.style.width = innerWidth + "px";
            this.div.style.left = "0 px";
        } else {
            this.div.style.width = SETTINGS.canvasWidth + "px";
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
        this.canvases.className = "chart__canvases";

        //graph
        this.graph = document.createElement("canvas");
        this.canvases.appendChild(this.graph);
        this.gCtx = this.graph.getContext("2d");

        this.graph.width = SETTINGS.canvasWidth;
        this.graph.height = SETTINGS.canvasHeight;

        this.graph.style.width = this.graph.width +'px';
        this.graph.style.height = this.graph.height +'px';
        this.graph.width *= pixelRatio;
        this.graph.height *= pixelRatio;

        // canvas for LINES NUMBERS DATES
        this.info = document.createElement("canvas");
        this.canvases.appendChild(this.info);
        this.info.className = "chart__info-canvas";

        this.iCtx = this.info.getContext("2d");

        this.info.width = SETTINGS.canvasWidth;
        this.info.height = SETTINGS.canvasHeight;
        this.info.style.width = this.info.width +'px';
        this.info.style.height = this.info.height +'px';
        this.info.width *= pixelRatio;
        this.info.height *= pixelRatio;

        // canvas for the POPUP
        this.popup = document.createElement("canvas");
        this.canvases.appendChild(this.popup);
        this.popup.className = "chart__info-canvas";

        this.pCtx = this.popup.getContext("2d");
        // this.popup.width = this.graph.width;
        // this.popup.height = this.graph.height;
        this.popup.width = SETTINGS.canvasWidth;
        this.popup.height = SETTINGS.canvasHeight;
        this.popup.style.width = this.popup.width +'px';
        this.popup.style.height = this.popup.height +'px';
        this.popup.width *= pixelRatio;
        this.popup.height *= pixelRatio;

        this.popup.addEventListener("mousemove", this.drawPopup.bind(this));
        // this.popup.addEventListener("touchstart", this.drawPopup.bind(this));
        this.popup.addEventListener("touchstart", () => {
            this.popup.addEventListener("touchmove", this.drawPopup.bind(this));
            this.popup.addEventListener("touchend", () => {
                this.popup.removeEventListener("touchmove", this.drawPopup);
                this.tooltip.style.opacity = "0";
                this.tooltip.style.display = "none";

                this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
            });
        });



        // container for the minimap and the slider
        this.miniDiv = document.createElement("div");
        this.div.appendChild(this.miniDiv);
        this.miniDiv.className = "chart__minimap";

        this.minimap = document.createElement("canvas");
        this.miniDiv.appendChild(this.minimap);
        this.mCtx = this.minimap.getContext("2d");
        // this.minimap.width = parseInt(getComputedStyle(this.miniDiv).width);
        // this.minimap.height = parseInt(getComputedStyle(this.miniDiv).height);
        // this.minimap.width = this.graph.width * 0.94;
        this.minimap.width = SETTINGS.canvasWidth * 0.97;
        ;
        this.minimap.height = SETTINGS.minimapHeight;

        // this.minimap.width = innerWidth * 0.8;
        // this.minimap.height = SETTINGS.minimapHeight;

        // this.minimap.width = innerWidth - (
        //     parseInt(getComputedStyle(this.miniDiv).marginLeft) +
        //         parseInt(getComputedStyle(this.div).marginRight));
        // this.popup.width = innerWidth;
        // this.popup.height = SETTINGS.canvasHeight;
        this.minimap.style.width = this.minimap.width +'px';
        this.minimap.style.height = this.minimap.height +'px';
        this.minimap.width *= pixelRatio;
        this.minimap.height *= pixelRatio;

    }
    createSlider(){
        this.lSpace = document.createElement("div");
        this.lSpace.className = "left-space";

        this.rSpace = document.createElement("div");
        this.rSpace.className = "right-space";

        this.slider = document.createElement("div");
        this.slider.className = "slider";

        // sizes
        this.lSpace.style.height = this.minimap.style.height;
        this.slider.style.height = parseInt(this.minimap.style.height) - 6 + "px";
        this.rSpace.style.height = this.minimap.style.height;

        this.lSpace.style.left = 0 + "px";
        this.lSpace.style.width = parseInt(this.minimap.style.width) * 0.7 + "px";

        this.slider.style.left = parseInt(this.lSpace.style.left) +
            parseInt(this.lSpace.style.width) + "px";
        this.slider.style.width = parseInt(this.minimap.style.width) * 0.3 - 11 + "px";


        this.rSpace.style.left =
            parseInt(this.slider.style.left) +
            parseInt(this.slider.style.width) + 12 + "px";

        this.rSpace.style.width = parseInt(this.minimap.style.width) -
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

            function addMovementListener(moveFunction) {
                window.addEventListener("touchmove", moveFunction);

                window.addEventListener("touchend", () =>{
                    window.removeEventListener("touchmove", moveFunction);
                });
            };

            this.slider.addEventListener("touchstart", () =>{
                this.previousTouchPosition = window.event.touches[0].clientX;
                let sliderLeft = this.slider.getBoundingClientRect().left;

                if (window.event.touches[0].clientX < sliderLeft + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.touches[0].clientX > sliderLeft +
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
            });
        };
        cursorListener();

    }
    createButtons(){

        let buttons = document.createElement("div");
        this.buttons = buttons; // to refer to in singleBarChart to hide it
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
                    this.justBeenRemoved = this.lines[i];
                    this.lines[i].isActive = false;
                } else {
                    this.justBeenSelected = this.lines[i];
                    this.lines[i].isActive = true;
                }
                this.drawGraphOnCheck();
                this.drawMinimapOnCheck();
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
        this.tooltip.className = "chart__tooltip";
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
        if (movementX != 0 && this.isAnyArrayActive()){
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
                parseInt(this.minimap.style.width) - border){

                this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";

                this.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";


                this.rSpace.style.left = parseInt(sliderStyle.left) +
                    parseInt(sliderStyle.width) + border  + "px";
                this.rSpace.style.width = parseInt(this.minimap.style.width) -
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
                parseInt(this.minimap.style.width) - border){

                this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

                this.rSpace.style.left = parseInt(sliderStyle.left) +
                    parseInt(sliderStyle.width) + border + "px";
                this.rSpace.style.width = parseInt(this.minimap.style.width) -
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
        let fps = 30;
        let now = Date.now();
        let elapsed = now - this.then;
        let fpsInterval = 1000 / fps;

        if (elapsed > fpsInterval){

            this.then = now - (elapsed % fpsInterval);
            this.drawGraphOnMovement();

        }

        // TODO recalculate the position of the
        this.configureSlider();

    }
    configureSlider(){
        this.sliderRect = this.slider.getBoundingClientRect();
        this.sliderWidth = parseInt(getComputedStyle(this.slider).width);
    }



    drawGraphOnCheck(){
        this.drawGraph(true);
    }
    drawMinimapOnCheck(){
        this.drawMinimap(true);
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
        if (!this.oldCeiling){ // if we set it for the first time
            this.oldCeiling = ceiling;
        }
        parameters.oldCeiling = this.oldCeiling;
        parameters.xOffset = xOffset;
        parameters.columnsOnCanvas = cutout.numOfVisibleGraphColumns;

        return parameters;
    }
    drawGraph(onButtonPress = false){
        let parameters = this.configureParametersForGraph();
        if (onButtonPress){
            parameters.onButtonPress = true;
        }

        if (this.oldCeiling != parameters.ceiling || onButtonPress) { // TODO consider code optimization with drawMinimap since it uses the same code
            if (!this.animationActive){

                this.animationActive = true;
                this.animation(parameters);

                this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
            }
        } else {
            parameters.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
            this.drawLinesForAllActiveArrays(parameters);
        }
        // if the ceiling has shifted - launch anim
    }
    configureParametersForMinimap(){
        let parameters = new DrawingParameters();
        let ceiling = this.findPrettyMax(0, this.x.length);
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
        parameters.ceiling = ceiling;
        parameters.oldCeiling = this.oldMinimapCeiling;
        parameters.xOffset = 0; // mini doesn't need an offset
        parameters.columnsOnCanvas = this.x.length;
        return parameters;
    }
    drawMinimap(onButtonPress = false){ // PARENTS: createButtons, launchChart,
        let parameters = this.configureParametersForMinimap();
        if (onButtonPress){
            parameters.onButtonPress = true;
        }

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);


        // checking if i need to do an animation
        if (this.oldMinimapCeiling != parameters.ceiling || onButtonPress) {
            this.animation(parameters);
            this.oldMinimapCeiling  = parameters.ceiling;
        } else {
            this.drawLinesForAllActiveArrays(parameters);
        }

    }
    findLowestLocalAmongActives(){
        let currentMin;
        currentMin = Math.min();
        // go through all the actives and find min
        //
        for (let l = 0; l < this.lines.length; l++){

        }
    }
    cutArrayAtLocalMin(parameters){

        let areaHeight = parameters.yEndPoint - parameters.yStartPoint;
        // lowest Local for all the active arrays at that slice


        let lowestLocal = Math.min(...parameters.yArray.slice(parameters.xStart, parameters.xEnd+1));
        let localCeiling = parameters.ceiling - lowestLocal;
        let localNumsPerPixel = areaHeight / localCeiling;

        let cutArray = [];
        for (let x = 0; x < parameters.yArray.length; x++){
            cutArray.push(parameters.yArray[x] - lowestLocal);

        }
        parameters.ceiling = localCeiling;
        parameters.yArray = cutArray;

    }

    drawLinesForAllActiveArrays(parameters){
        //takes parameters from drawGraph or drawMinimap and paints all the active lines and stuff
        for (let i=0; i < this.lines.length; i++){
            if (this.lines[i].isActive || this.lines[i] == this.justBeenRemoved) {
                // when turning a line on/off
                if (this.lines[i] == this.justBeenSelected && parameters.onButtonPress){
                    parameters.ctx.globalAlpha = 1 / NUMOFFRAMES * parameters.currentFrame;
                } else if (this.lines[i] == this.justBeenRemoved && parameters.onButtonPress){
                    parameters.ctx.globalAlpha = 1 - 1 / NUMOFFRAMES * parameters.currentFrame;
                }
                parameters.color = this.lines[i]["color"];
                parameters.yArray = this.lines[i]["array"];
                // this.cutArrayAtLocalMin(parameters);
                this.drawLine(parameters);
                parameters.ctx.globalAlpha = 1;
            }
        }
    }
    drawLine({ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
              xStart, xEnd, ceiling, xOffset, columnsOnCanvas}) {
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        // find lowest local val
        //


        let columnWidth = areaWidth  / columnsOnCanvas; //used to calculate the number of columns on the screen
        let numsPerPixel = areaHeight / ceiling;

        let currentX = xStartPoint - xOffset;
        let currentY = help.round(yArray[xStart] * numsPerPixel) - yStartPoint;


        ctx.beginPath();
        // ctx.moveTo(currentX, currentY);
        for (let i = xStart; i < xEnd + 1; i++) {
            currentX = help.round((i - xStart) * columnWidth) - xOffset;
            currentY = yEndPoint - help.round( yArray[i] * numsPerPixel ) - yStartPoint;
            // currentY = yEndPoint - help.round((yArray[i]-lowestLocal) * localNumsPerPixel) - yStartPoint;

            ctx.lineTo(currentX, currentY);
        }
        ctx.lineJoin = "round";
        if (ctx == this.gCtx){
            ctx.lineWidth = 2 * pixelRatio;
        } else {
            ctx.lineWidth = 1 * pixelRatio;
        }
        ctx.strokeStyle = color;

        ctx.stroke();

    }
    animation(parameters){
        let currentOldCeiling = parameters.oldCeiling;
        let currentFutureCeiling = parameters.ceiling;
        let currentNumOfFrames = NUMOFFRAMES;

        let difference = currentFutureCeiling - currentOldCeiling;
        let distributedDifference = difference / NUMOFFRAMES;

        let currentFrame = 1;

        this.drawAnimation(parameters, currentOldCeiling, distributedDifference, currentFrame, currentFutureCeiling);

    }
    animationFrame(parameters){
        this.drawLinesForAllActiveArrays(parameters);
    }


    drawAnimation = (parameters, currentOldCeiling, distributedDifference, currentFrame, currentFutureCeiling) => {
        if (currentFrame <= NUMOFFRAMES) {
            if (parameters.ctx == this.gCtx){ // detects whether it's the minimap or the graph
                if (parameters.onButtonPress){ // for ALPHA ANIMATION
                    parameters = this.configureParametersForGraph();
                    parameters.onButtonPress = true;
                } else{
                    parameters = this.configureParametersForGraph();
                }
            } else {
                if (parameters.onButtonPress){
                    parameters = this.configureParametersForMinimap();
                    parameters.onButtonPress = true;
                } else {
                    parameters = this.configureParametersForMinimap();
                }
            }

            requestAnimationFrame(() => {
                this.drawAnimation(parameters, currentOldCeiling, distributedDifference,
                                   currentFrame, currentFutureCeiling);
            });


            parameters.currentFrame = currentFrame;
            parameters.ctx.clearRect(0, 0, parameters.xEndPoint, parameters.yEndPoint);
            parameters.ceiling = currentOldCeiling + (distributedDifference * currentFrame);
            this.animationFrame(parameters);


            currentFrame += 1;

            // find rel between ceilings

            let newOldRelationship = currentFutureCeiling / currentOldCeiling;
            this.drawNumbers(currentOldCeiling, newOldRelationship, currentFrame);
            this.drawNumbers(currentFutureCeiling, newOldRelationship, currentFrame);
        } else {
            this.justBeenRemoved = null;
            this.justBeenSelected = null;
            this.animationActive = false;
            this.drawGraph();
            // this.drawLinesForAllActiveArrays(parameters); // TODO drawgraph or this hmmm
            this.drawNumbers(currentFutureCeiling, 1, NUMOFFRAMES);
            if(!this.isAnyArrayActive()){
                this.iCtx.clearRect(0, 0, this.graph.width, this.graph.height);
            }

        }
    };



    drawHorizontalLines(rowHeight){
        let drawLines = () =>{
            let x = 0;
            let xEnd = this.graph.width;
            let y = DATESPACE - 21 * pixelRatio;
            for (let i = 0; i < NUMOFROWS; i++){
                this.iCtx.moveTo(x, y);
                this.iCtx.lineTo(xEnd, y);
                y += rowHeight;
            }
        };
        this.iCtx.beginPath();
        drawLines();

        this.iCtx.globalAlpha = 0.2;
        this.iCtx.lineWidth = "2";
        // this.iCtx.strokeStyle = "grey";
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
        skipFactor = Math.floor(80 / columnWidth * pixelRatio);


        let y = this.graph.height - 5 * pixelRatio;
        let currentX = 0;

        this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
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
    drawNumbers(ceiling, newOldRelationship = 1, currentFrame = 1, side="L") {
        // drawing the numbers on the left side
        let y = this.graph.height - DATESPACE;

        // old ceil is used to calc nums
        // new to calc position
        let opacity = 1 - (1 / currentFrame);

        if (side == "L"){
            this.iCtx.clearRect(0, 0, this.graph.width, y);
        }
        let curNum = 0;
        let rowStep = ceiling / NUMOFROWS;


        // let newRow = newOldRelationship * oldRow;
        let distributedRelationship = newOldRelationship / NUMOFFRAMES;
        // let distributedDifference = difference / NUMOFFRAMES;
        let rowHeight = (this.graph.height - DATESPACE) / NUMOFROWS * distributedRelationship * currentFrame;
        // TODO round floats
        // let numsPerPixel = areaHeight / NUMOFROWS;
        // get the difference between previous and new ceiling
        // use that difference to change LOCAL nums per pixel
        let xPosition;
        if (side == "L"){
            xPosition = 20;
        } else {
            xPosition = this.graph.width - 50 * pixelRatio;
        }


        this.iCtx.globalAlpha = opacity;
        this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
        this.iCtx.fillStyle = "grey";
        for (let i=0; i < NUMOFROWS; i++){
            this.iCtx.fillText(myMath.formatNumber(curNum, true), xPosition, y - 10);
            curNum += rowStep;
            y -= rowHeight;
        }
        this.iCtx.lineWidth = 1;

        if (currentFrame % 2 == 0 || currentFrame == 1){ //launches lines but not too frequently
            this.drawHorizontalLines(rowHeight);
        } else {

        }
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
        this.tooltip.innerHTML = `<p class="header" style="color:${color};">${date}</p>`;

        // show the tooltip at needed location

        let width = this.tooltip.offsetWidth;
        // on the right side, if no space - on the left side
        this.tooltip.style.opacity = "1";
        this.tooltip.style.display = "block";

        this.tooltip.style.left = currentXPos - width - 100 + "px";
        this.tooltip.style.top = 70 + "px";
        // if the width of the div is smaller than canvas-divleft


        let left = this.tooltip.offsetLeft;
        // left = this.tooltip.clientX;
        if (left < this.graph.offsetLeft) {
            this.tooltip.style.left = currentXPos + 75 + "px";
        }
        left = this.tooltip.getBoundingClientRect().left;


        if ((left + width) > innerWidth){
            this.tooltip.style.left = innerWidth - (left + width) + "px";
        }
        this.addItemsToTooltip(currentArrayColumn);

    };
    addItemsToTooltip(currentArrayColumn){
        // Displaying each item
        let number;
        let name;
        let style;
        for (let i in this.lines){
            if (this.lines[i].isActive){
                // get the date
                number = this.lines[i]["array"][currentArrayColumn];
                name = this.lines[i]["checkboxName"];
                style = `margin: 10px; color: ${this.lines[i]["color"]}`;
                this.tooltip.innerHTML +=
                    `<div style="${style}"><span class="name">${name}</span><span class="number">${number}</span></div>`;
            }
        }
    }
    drawCircles(conversionQuotient, currentXPos, currentArrayColumn){
        // drawing the circles for each line based on its configuration
        let convertedYValue;
        for (let i in this.lines){
            if (this.lines[i].isActive){
                convertedYValue =
                    this.graph.height - this.lines[i]["array"][currentArrayColumn] *
                    conversionQuotient - DATESPACE;



                this.pCtx.beginPath();
                this.pCtx.arc(currentXPos, convertedYValue,
                              6 * pixelRatio, 0, Math.PI * 2);
                this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
                this.pCtx.strokeStyle = this.lines[i]["color"];
                this.pCtx.fill();
                this.pCtx.lineWidth = 2 * pixelRatio;
                this.pCtx.stroke();
                this.pCtx.fillStyle = "black";


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
    drawPopup(event){

        let clientX;
        if (event.type === "touchmove"){ // check if on mobile
            clientX = event.touches[0].clientX * pixelRatio;
        } else {
            clientX = event.clientX * pixelRatio;
        }
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

        // let convertedYValue;

        // TODO optimize this code for offset
        let xOffset = cutout.sliderOffset / this.minimap.width * this.graph.width;
        let numOfCutColumns = cutout.sliderColumnEnd - cutout.sliderColumnStart;
        xOffset = xOffset / numOfCutColumns * this.x.length;

        let currentXPos = currentGraphColumn * columnWidth - xOffset;

        this.drawGraphPopup(currentArrayColumn, currentXPos, conversionQuotient);

    }
    drawGraphPopup(currentArrayColumn, currentXPos, conversionQuotient){
        this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
        this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);
        this.drawVerticalLine(currentXPos);
        this.drawCircles(conversionQuotient, currentXPos, currentArrayColumn);
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



let themeButton;
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
        // chart.redraw(); // why did i put it here


    }
    for (let i = 0; i < arrayOfNewCharts.length; i++){

        chart = arrayOfNewCharts[i];
        if (color == DAY.lead){
            chart.div.style.color = NIGHT.lead;

            // if (!chart.checkmark.checked){
            //     chart.checkmark.style.backgroundColor = document.body.style.backgroundColor;
        } else {
            chart.div.style.color = DAY.lead;
            // chart.displayTooltip(window.event); // redraw the tooltip
        }
    }
    if (color == DAY.lead){
        themeButton.innerHTML = "Switch to Night Mode";
    } else {
        themeButton.innerHTML = "Switch to Day Mode";
    }
}
function putThemeButton(){
    let buttonContainer = document.querySelector(".switch-button-container");
    // document.body.appendChild(buttonContainer);
    // buttonContainer.id = "switch-container";

    themeButton = document.createElement("span");
    buttonContainer.appendChild(themeButton);
    // themeButton.type = "a";
    themeButton.className = "switch-button";
    themeButton.innerHTML = "Switch to Day Mode";
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

let documentWidth;
let documentHeight;
function onLoad(){
    documentWidth = innerWidth;
    documentHeight = window.screen.height;
}

let throttled;
function onResize(){
    if (!throttled && (documentWidth != innerWidth || documentHeight != window.screen.height)) {
        location.reload();
        throttled = true;

        setTimeout(function() {
            throttled = false;
        }, 250);

        documentWidth = innerWidth;
        documentHeight = window.screen.height;
    }

}

window.addEventListener("load", onLoad);
window.addEventListener("resize", onResize);




// STAGE 2


class lineChart extends Chart{
    constructor(data){
        let title = "Line Chart";
        super(data, title);
        // importDays(1);
    }
}

class line2YChart extends Chart{
    constructor(data){
        let title = "2 Y-Axes Chart";
        super(data, title);

        // VARS
        this.oldCeilingFirst = 0;
        this.oldCeilingSecond = 0;

        this.drawNumbers(this.configureParametersForGraphFirst().ceiling, 1, NUMOFFRAMES);
        this.drawNumbers(this.configureParametersForGraphSecond().ceiling, 1, NUMOFFRAMES, "R");
    }


    findPrettyMax(xStart, xEnd, array = []){
        //find max THEN turn it into a pretty num
        let slicedArray = array.slice(xStart, xEnd+1);

        let currentMax = 0;
        currentMax = Math.max(myMath.findMaxInArray(slicedArray), currentMax);
        // turn into pretty
        return myMath.findPrettyRoundNum(currentMax);

    }
    configureParametersForGraphFirst(){
        let parameters = this.configureParametersForGraph();
        parameters.yArray = this.lines[0].array;
        parameters.color = this.lines[0].color;
        parameters.ceiling = this.findPrettyMax(parameters.xStart, parameters.xEnd, parameters.yArray);
        if (!this.oldCeilingFirst){ // if we set it for the first time
            this.oldCeilingFirst = parameters.ceiling;
        }
        parameters.oldCeiling = this.oldCeilingFirst;
        return parameters;
    }
    configureParametersForGraphSecond(){
        let parameters = this.configureParametersForGraph();
        parameters.yArray = this.lines[1].array;
        parameters.color = this.lines[1].color;
        parameters.ceiling = this.findPrettyMax(parameters.xStart, parameters.xEnd, parameters.yArray);
        if (!this.oldCeilingSecond){ // if we set it for the first time
            this.oldCeilingSecond = parameters.ceiling;
        }
        parameters.oldCeiling = this.oldCeilingSecond;
        return parameters;
    }

    configureParametersForMinimapFirst(){
        let parameters = this.configureParametersForMinimap();
        parameters.yArray = this.lines[0].array;
        parameters.color = this.lines[0].color;
        parameters.ceiling = this.findPrettyMax(0, this.x.length, parameters.yArray);
        if (!this.oldMinimapCeilingFirst){ // if we set it for the first time
            this.oldMinimapCeilingFirst = parameters.ceiling;
        }
        parameters.oldCeiling = this.oldMinimapCeilingFirst;
        return parameters;
    }
    configureParametersForMinimapSecond(){
        let parameters = this.configureParametersForMinimap();
        parameters.yArray = this.lines[1].array;
        parameters.color = this.lines[1].color;
        parameters.ceiling = this.findPrettyMax(0, this.x.length, parameters.yArray);
        if (!this.oldMinimapCeilingSecond){ // if we set it for the first time
            this.oldMinimapCeilingSecond = parameters.ceiling;
        }
        parameters.oldCeiling = this.oldMinimapCeilingSecond;
        return parameters;
    }
    drawMinimap(onButtonPress = false){ // PARENTS: createButtons, launchChart,

        let first = this.lines[0];
        let second = this.lines[1];
        let parametersFirst = this.configureParametersForMinimapFirst();
        let parametersSecond = this.configureParametersForMinimapSecond();

        if (onButtonPress){
            parametersFirst.onButtonPress = true;
            parametersSecond.onButtonPress = true;
        }

        // checking if i need to do an animation
        if (this.oldMinimapCeilingFirst != parametersFirst.ceiling
            || this.oldMinimapCeilingSecond != parametersSecond.ceiling || onButtonPress) { // TODO consider code optimization with drawMinimap since it uses the same code
            // this.animation(parameters);
            // this.oldMinimapCeiling  = parameters.ceiling;
            this.animation(parametersFirst, parametersSecond);

            this.oldMinimapCeilingFirst = parametersFirst.ceiling; // NOTE that it will change before anim end
            this.oldMinimapCeilingSecond = parametersSecond.ceiling; // NOTE that it will change before anim end
        } else {
            this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
            this.drawLine2Y(parametersFirst);
            this.drawLine2Y(parametersSecond);
        }

    }
    drawGraph(onButtonPress = false){
        // configure parameters for first
        let first = this.lines[0];
        let second = this.lines[1];
        let parametersFirst = this.configureParametersForGraphFirst();
        let parametersSecond = this.configureParametersForGraphSecond();
        if (onButtonPress){
            parametersFirst.onButtonPress = true;
            parametersSecond.onButtonPress = true;
        }


        if (this.oldCeilingFirst != parametersFirst.ceiling || this.oldCeilingSecond != parametersSecond.ceiling || onButtonPress) { // TODO consider code optimization with drawMinimap since it uses the same code
            if (!this.animationActive){

                this.animationActive = true;
                this.animation(parametersFirst, parametersSecond);

                this.oldCeilingFirst = parametersFirst.ceiling; // NOTE that it will change before anim end
                this.oldCeilingSecond = parametersSecond.ceiling; // NOTE that it will change before anim end
            }
        } else {
            parametersFirst.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
            if (this.lines[0].isActive){
                this.drawLine2Y(parametersFirst);
            }
            if (this.lines[1].isActive){
                this.drawLine2Y(parametersSecond);
            }
            // this.drawLinesForAllActiveArrays(para);
        }
    }
    animation(parametersFirst, parametersSecond){

        let currentOldCeilingFirst = parametersFirst.oldCeiling;
        let currentFutureCeilingFirst = parametersFirst.ceiling;
        let currentOldCeilingSecond = parametersSecond.oldCeiling;
        let currentFutureCeilingSecond = parametersSecond.ceiling;
        let currentNumOfFrames = NUMOFFRAMES;

        let differenceFirst = currentFutureCeilingFirst - currentOldCeilingFirst;
        let distributedDifferenceFirst = differenceFirst / NUMOFFRAMES;
        let differenceSecond = currentFutureCeilingSecond - currentOldCeilingSecond;
        let distributedDifferenceSecond = differenceSecond / NUMOFFRAMES;

        let currentFrame = 1;

        this.drawAnimation2Y(parametersFirst, parametersSecond, currentOldCeilingFirst, currentFutureCeilingSecond, distributedDifferenceFirst, distributedDifferenceSecond,
                             currentFrame, currentFutureCeilingFirst, currentFutureCeilingSecond);
    }
    drawLine2Y(parameters){
        // wrapper that starts at local min
        // this.cutArrayAtLocalMin(parameters);
        this.drawLine(parameters);
    }
    animationFrame(parametersFirst, parametersSecond){
        // if (this.lines[i] == this.justBeenSelected && parameters.onButtonPress){
        //     // parameters.ctx.globalAlpha = 1 / NUMOFFRAMES * parameters.currentFrame;
        // } else if (this.lines[i] == this.justBeenRemoved && parameters.onButtonPress){
        //     // parameters.ctx.globalAlpha = 1 - 1 / NUMOFFRAMES * parameters.currentFrame;
        // }

        if (this.lines[0].isActive || this.lines[0] == this.justBeenRemoved){
            if (this.lines[0] == this.justBeenSelected && parametersFirst.onButtonPress){
                parametersFirst.ctx.globalAlpha = 1 / NUMOFFRAMES * parametersFirst.currentFrame;
            } else if (this.lines[0] == this.justBeenRemoved && parametersFirst.onButtonPress) {
                parametersFirst.ctx.globalAlpha = 1 - 1 / NUMOFFRAMES * parametersFirst.currentFrame;
            }
            this.drawLine2Y(parametersFirst);
        }
        parametersFirst.ctx.globalAlpha = 1;

        if (this.lines[1].isActive || this.lines[1] == this.justBeenRemoved){
            if (this.lines[1] == this.justBeenSelected && parametersSecond.onButtonPress){
                parametersFirst.ctx.globalAlpha = 1 / NUMOFFRAMES * parametersFirst.currentFrame;
            } else if (this.lines[1] == this.justBeenRemoved && parametersFirst.onButtonPress) {
                parametersFirst.ctx.globalAlpha = 1 - 1 / NUMOFFRAMES * parametersFirst.currentFrame;
            }
            this.drawLine2Y(parametersSecond);
        }
        parametersFirst.ctx.globalAlpha = 1;
    }
    drawAnimation2Y(parametersFirst, parametersSecond, currentOldCeilingFirst,
                    currentOldCeilingSecond, distributedDifferenceFirst,
                    distributedDifferenceSecond, currentFrame, currentFutureCeilingFirst,
                    currentFutureCeilingSecond){
        if (currentFrame <= NUMOFFRAMES) {
            if (parametersFirst.ctx == this.gCtx){ // detects whether it's the minimap or the graph
                if (parametersFirst.onButtonPress){ // for ALPHA ANIMATION
                    parametersFirst = this.configureParametersForGraphFirst();
                    parametersSecond = this.configureParametersForGraphSecond(); // TODO how to make them diff
                    parametersFirst.onButtonPress = true;
                    parametersSecond.onButtonPress = true;
                } else{
                    parametersFirst = this.configureParametersForGraphFirst();
                    parametersSecond = this.configureParametersForGraphSecond(); // TODO how to make them diff
                }
            } else {
                if (parametersFirst.onButtonPress){ // for ALPHA ANIMATION
                    parametersFirst = this.configureParametersForMinimapFirst();
                    parametersSecond = this.configureParametersForMinimapSecond();
                    parametersFirst.onButtonPress = true;
                    parametersSecond.onButtonPress = true;
                } else {
                    parametersFirst = this.configureParametersForMinimapFirst();
                    parametersSecond = this.configureParametersForMinimapSecond();
                }
            }

            requestAnimationFrame(() => {
                this.drawAnimation2Y(parametersFirst, parametersSecond, currentOldCeilingFirst, currentFutureCeilingSecond, distributedDifferenceFirst, distributedDifferenceSecond,
                                     currentFrame, currentFutureCeilingFirst, currentFutureCeilingSecond);
            });

            parametersFirst.ctx.clearRect(0, 0, parametersFirst.xEndPoint, parametersFirst.yEndPoint);

            // parametersFirst.ceiling = currentOldCeilingFirst + (distributedDifferenceFirst * currentFrame);
            parametersFirst.ceiling = currentOldCeilingFirst + (distributedDifferenceFirst * currentFrame);
            // TODO weird, why do i not set param second ceiling?
            parametersFirst.currentFrame = currentFrame;
            this.animationFrame(parametersFirst, parametersSecond);


            currentFrame += 1;

            // find rel between ceilings for nums
            let newOldRelationshipFirst = currentFutureCeilingFirst / currentOldCeilingFirst;
            let newOldRelationshipSecond = currentFutureCeilingSecond / currentOldCeilingSecond;

            // this.drawNumbers(currentOldCeilingFirst, newOldRelationshipFirst, currentFrame);
            this.drawNumbers(currentFutureCeilingFirst, newOldRelationshipFirst, currentFrame);

            // this.drawNumbers(currentOldCeilingSecond, newOldRelationshipSecond, currentFrame, "R");
            this.drawNumbers(currentFutureCeilingSecond, newOldRelationshipSecond, currentFrame, "R");
        } else {
            this.justBeenRemoved = null;
            this.justBeenSelected = null;
            this.animationActive = false;
            this.drawGraph();
            // this.drawLinesForAllActiveArrays(parameters); // TODO drawgraph or this hmmm
            this.drawNumbers(currentFutureCeilingFirst, 1, NUMOFFRAMES);
            this.drawNumbers(currentFutureCeilingSecond, 1, NUMOFFRAMES, "R");

        }
    };
    drawCircles(conversionQuotient, currentXPos, currentArrayColumn){
        // drawing the circles for each line based on its configuration
        let convertedYValue;
        let ceilingFirst = this.configureParametersForGraphFirst().ceiling;
        let ceilingSecond = this.configureParametersForGraphSecond().ceiling;
        let conversionQuotientFirst = (this.graph.height - DATESPACE) / ceilingFirst;
        let conversionQuotientSecond = (this.graph.height - DATESPACE) / ceilingSecond;

        let convertedYValueFirst =
            this.graph.height - this.lines[0]["array"][currentArrayColumn] *
            conversionQuotientFirst - DATESPACE;
        let convertedYValueSecond =
            this.graph.height - this.lines[1]["array"][currentArrayColumn] *
            conversionQuotientSecond - DATESPACE;
        for (let i in this.lines){
            if (this.lines[i].isActive){

                if (i == 0){
                    convertedYValue = convertedYValueFirst;
                } else {
                    convertedYValue = convertedYValueSecond;
                }


                this.pCtx.beginPath();
                this.pCtx.arc(currentXPos, convertedYValue,
                              6 * pixelRatio, 0, Math.PI * 2);
                this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
                this.pCtx.strokeStyle = this.lines[i]["color"];
                this.pCtx.fill();
                this.pCtx.lineWidth = 2 * pixelRatio;
                this.pCtx.stroke();
                this.pCtx.fillStyle = "black";


            }
        }

    };
}


class barChart extends Chart{
    constructor(data, title){
        super(data, title);
    }




    drawBars({ctx, yArray, xStart, xEnd, color, yEndPoint, yStartPoint, barOffset=0, arrayOfOffsets, ceiling, xOffset, columnsOnCanvas, xStartPoint, xEndPoint, selectedColumn = null}){
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
        let fillWidth = areaWidth / columnsOnCanvas + 1; // on the X axis


        // check if there's selected column specified; if it's null = opacity to 1 else - transparent; then check inside the loop for the chosen one
        if (selectedColumn !== null){
            ctx.globalAlpha = 0.3;
        } else {
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = color;
        for (let x = xStart; x < xEnd + 1; x++) {

            currentOffset = arrayOfOffsets[x] * numsPerPixel; //TEMP
            currentY = yEndPoint - help.round( yArray[x] * numsPerPixel )
                - yStartPoint - currentOffset;
            currentX = help.round((x - xStart) * columnWidth) - xOffset;

            fillDistance = areaHeight - currentY - currentOffset; // on the Y axis
            fillWidth = areaWidth / columnsOnCanvas + 1; // on the X axis
            if (x == selectedColumn){
                ctx.globalAlpha = 1;
                ctx.fillRect(currentX - xOffset, currentY, fillWidth, fillDistance);
                ctx.globalAlpha = 0.3;
            } else {
                ctx.fillRect(currentX - xOffset, currentY, fillWidth, fillDistance);
            }
            // TODO insert spaces between columns

        }
        // return the calculated stuff for
        // previous bar height (fill distance)


    }
}

class stackedBarChart extends barChart{
    constructor(data){
        let title = "Stacked Bars";
        super(data, title);
    }
    destructureData(data){
        super.destructureData(data);
        this.bars = this.lines;
    }

    getSummedArray(xStart=0, xEnd=this.bars[0].length){
        // sums all array into a single array to find the ceiling
        // TODO change for all the active arrays
        // create an empty arrays
        let summedArray = [];
        for (let x = 0; x < this.x.length; x++){
            summedArray.push(0);
        }

        // use that array summing functions
        // let summedArray = [...this.bars[0].array.slice(xStart, xEnd+1)];
        let currentArray;
        for (let i= 0; i < this.bars.length; i++){

            if (this.bars[i].isActive){
                myMath.addSecondArrayToFirst(summedArray, this.bars[i].array);

                // currentArray = this.bars[i].array.slice(xStart, xEnd+1);
                // for (let j = xStart; j < xEnd + 1; j++){
                //     summedArray[j] += currentArray[j];

                // }
            }
        }
        // send the array to find ceil
        return summedArray.slice(xStart, xEnd+1);
    }
    findPrettyMax(xStart, xEnd){
        let array = this.getSummedArray(xStart, xEnd);
        return myMath.findPrettyRoundNum(Math.max(...array));
    }


    animationFrame(parameters){
        this.drawStackedBars(parameters);
    }
    drawGraph(){
        // TODO clearing the canvas should prolly be done in the wrapper using the param ctx
        let parameters = this.configureParametersForGraph();

        if (this.oldCeiling != parameters.ceiling) { // TODO consider code optimization with drawMinimap since it uses the same code
            if (!this.animationActive){

                this.animationActive = true;
                this.animation(parameters);

                this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
            }
        } else {
            parameters.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
            this.drawStackedBars(parameters);
        }

        // this.drawStackedBars(parameters);
    }
    drawMinimap(){
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
        // parameters.ceiling = ceiling;
        if (this.oldMinimapCeiling != parameters.ceiling) {
            this.animation(parameters);
            this.oldMinimapCeiling  = parameters.ceiling;
        } else {
            this.drawStackedBars(parameters);
        }
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
    drawGraphPopup(currentArrayColumn, currentXPos, convertedYValue, conversionQuotient){
        // PARENT: drawPopup in Chart
        this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);

        // making a column transparent
        let parameters = this.configureParametersForGraph();
        parameters.selectedColumn = currentArrayColumn;
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawStackedBars(parameters);
    }
    drawCanvasMask(ctx, currentXPos){
        ctx.fillStyle = "grey";
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, currentXPos, this.graph.height);
        ctx.globalAlpha = 1;
    }

}

class singleBarChart extends barChart{
    constructor(data){
        let title = "Bars";
        super(data, title);

        // TODO days
        // this.days = [];
        // importDays(4, this.days);

        // hide the button
        this.buttons.style.display = "none";

    }
    destructureData(data){
        super.destructureData(data);

        // this.x = data["columns"][0];
        this.y = data["columns"][1];
        // this.x.splice(0, 1);
        this.y.splice(0, 1);
        this.color = data["colors"]["y0"];
    }
    findPrettyMax(xStart, xEnd){
        let array = this.y; // TODO make for cutout
        let slicedArray = array.slice(xStart, xEnd + 1);
        return myMath.findPrettyRoundNum(Math.max(...slicedArray));
    }

    drawGraph(){
        let parameters = this.configureParametersForGraph();

        if (this.oldCeiling != parameters.ceiling) {
            if (!this.animationActive){

                this.animationActive = true;
                this.animation(parameters);

                this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
            }
        } else {
            parameters.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
            // this.drawLinesForAllActiveArrays(parameters);
            this.drawBars(parameters);
        }
        // if the ceiling has shifted - launch anim
    }
    drawGraphOld(){
        // this.drawBars(this.y, 300, this.x.length, this.color);
        let parameters = this.configureParametersForGraph();

        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawBars(parameters);

    }
    animationFrame(parameters){
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
    drawGraphPopup(currentArrayColumn, currentXPos, convertedYValue, conversionQuotient){
        // PARENT: drawPopup in Chart
        this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);

        // making a column transparent
        let parameters = this.configureParametersForGraph();
        parameters.selectedColumn = currentArrayColumn;
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawBars(parameters);
    }
}



class areaChart extends Chart{
    constructor(data){
        let title = "Area/Pie Chart";
        super(data, title);

        this.boundChangeMode = this.changeMode.bind(this);
        this.boundSelectPieceOfPie = this.selectPieceOfPie.bind(this);
        this.popup.addEventListener("click", this.boundChangeMode);
        // this.popup.addEventListener("touchstart", this.drawGraphWithAPie.bind(this));
        this.mode = "area";


        // adding the zoom button
        this.zoomButton = document.createElement("button");
        this.canvases.appendChild(this.zoomButton);
        this.zoomButton.className = "zoom-button";
        this.zoomButton.textContent = "Zoom Out";
        this.zoomButton.style.display = "none";
        this.zoomButton.addEventListener("click", this.changeMode.bind(this));

        this.periodText = document.createElement("p");
        this.canvases.appendChild(this.periodText);
        this.periodText.className = "period-text";
        this.periodText.textContent = "whoo";
        this.periodText.style.display = "none";

        this.piePopup = document.createElement("div");
        this.canvases.appendChild(this.piePopup);
        this.piePopup.className = "pie-popup";
        this.piePopup.style.display = "none";
    }
    changeMode(){
        if (this.mode == "area"){
            this.mode = "pie";
            this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
            this.iCtx.clearRect(0, 0, this.info.width, this.info.height);
            this.drawGraphWithAPie();
            // hide popup
            this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
            this.tooltip.style.display = "none";
            this.zoomButton.style.display = "block";
            this.periodText.style.display = "block";
            this.drawDates(this.configureParametersForGraph());
            this.popup.removeEventListener("click", this.boundChangeMode);
            this.popup.addEventListener("click", this.boundSelectPieceOfPie);
        } else {
            this.mode = "area";
            this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
            // TODO draw numbers
            this.drawGraph();
            this.drawDates(this.configureParametersForGraph());
            this.drawNumbers();
            this.zoomButton.style.display = "none";
            this.periodText.style.display = "none";
            this.popup.addEventListener("click", this.boundChangeMode);
            this.popup.removeEventListener("click", this.boundSelectPieceOfPie);
        }
    }
    selectPieceOfPie(){
        // check if the x/y are inside the circle
        if (!this.selectedPie){
            this.selectedPie = 0;
        }
        this.selectedPie += 1;
        // if inactive += 1
        if (this.selectedPie == this.lines.length){
            this.selectedPie = -1;
            this.selectPieceOfPie();
        } else if (!this.lines[this.selectedPie].isActive){
            this.selectPieceOfPie();
        } else {
            this.drawGraphWithAPie();
            this.popPiePopup();

        }
        // if = lines length = set to 0 and repeat
        // otherwise - redraw with this parameter

        // scroll through them
    }
    configureParametersForGraph(){
        let parameters = super.configureParametersForGraph();
        parameters.displayNumbers = false;
        return parameters;
    }
    drawGraph(){
        let parameters = this.configureParametersForGraph();
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        let configuredArea = this.configureArea(parameters);
        let percentLines = configuredArea[0];
        let arrayOfOffsets = configuredArea[1];

        if (!this.oldGraphPercentLines){
            this.oldGraphPercentLines = percentLines; // used to track changes for animation
        }

        if (!myMath.arraysOfArraysAreEqual(percentLines, this.oldGraphPercentLines)){
            this.animation(parameters, this.oldGraphPercentLines, percentLines, arrayOfOffsets);
            this.oldGraphPercentLines = percentLines;
        } else {
            this.sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets);
        }

    }
    drawMinimap(){
        let parameters = this.configureParametersForMinimap();

        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
        // this.drawWithAnArea(parameters);
        let configuredArea = this.configureArea(parameters);
        let percentLines = configuredArea[0];
        let arrayOfOffsets = configuredArea[1];

        if (!this.oldMinimapPercentLines){
            this.oldMinimapPercentLines = percentLines; // used to track changes for animation
        }

        if (!myMath.arraysOfArraysAreEqual(percentLines, this.oldMinimapPercentLines)){
            this.animation(parameters, this.oldMinimapPercentLines, percentLines, arrayOfOffsets);
            this.oldMinimapPercentLines = percentLines;
        } else {
            this.sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets);
        }
    }
    animationFrame(parameters){
        this.drawWithAnArea(parameters);
    }
    configureArea(parameters){

        parameters.floorArray = this.lines[0];// floorArray;
        parameters.roofArray = this.lines[0];
        parameters.color = this.lines[0].color;

        let percentLines = []; //array of arrays TODO really huge floats
        let arrayOfOffsets = [];

        // translating each array into an array of percentages
        // STEP 1: finding the sum of all active arrays
        let sumArray = [];
        for (let x = 0; x < this.x.length; x++){ // create an empty sum array
            sumArray.push(0);
        }
        for(let x = 0; x < this.x.length; x++){
            // sum all Y's
            for (let y = 0; y < this.lines.length; y++) {
                if (this.lines[y].isActive){
                    sumArray[x] += this.lines[y].array[x];
                }
            }
            // creating array of offsets for drawArea
            arrayOfOffsets.push(1);
        }

        // STEP 2: finding % of each array relative to sum
        // for each Y - divide the sum by that and add to corresponding sumarray
        for (let y = 0; y < this.lines.length; y++) {
            percentLines.push([]);
            for (let x = 0; x < this.x.length; x++){
                if (!this.lines[y].isActive){ // NOTE
                    percentLines[y].push(0);
                } else{
                    percentLines[y].push(1 / sumArray[x] * this.lines[y].array[x]);
                }
            }
            // TODO if turned off - push all 0s

        }
        return [percentLines, arrayOfOffsets];
    }
    sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets){
        for (let y = 0; y < percentLines.length; y++){
            if (this.lines[y].isActive || this.lines[y] == this.justBeenRemoved){
                parameters.arrayOfOffsets = arrayOfOffsets;
                parameters.yArray = percentLines[y];
                parameters.color = this.lines[y].color;
                this.drawArea(parameters);

            }
        }
    }
    drawGraphOnMovement(){
        this.drawDates(this.configureParametersForGraph());
        if (this.mode == "pie"){
            this.drawGraphWithAPie();
        } else {
            this.drawGraph();
        }
    }
    drawGraphOnCheck(){
        if (this.mode == "pie"){
            this.drawGraphWithAPie();
        } else {
            this.drawGraph();
        }
    }
    drawGraphWithAPie(){
        let cutout = this.calculateCutout();
        let xStart = cutout.sliderColumnStart;
        let xEnd = cutout.sliderColumnEnd;
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);

        // sum up each array and find a relatinship and convert that to a percentarr
        let sum;
        let arrayOfSums = [];
        for (let y = 0; y < this.lines.length; y++){
            sum = 0;
            if (this.lines[y].isActive){
                for (let x = xStart; x < xEnd; x++) {
                    sum += this.lines[y].array[x];
                }
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
            if(this.lines[y].isActive){
                this.drawPie(percentPie[y], currentPieOffset, this.lines[y].color, y);
                currentPieOffset += percentPie[y];
            }
        }

    }
    drawArea({ctx, arrayOfOffsets, yArray, color, xEndPoint, xStartPoint, ceiling, yEndPoint, yStartPoint, xStart, xEnd, xOffset, columnsOnCanvas}){
        // takes an array of percentages of graph width
        // use the given percentage and multiply areaHeight by it
        // let yEndPoint = this.graph.height - DATESPACE;
        // let yStartPoint = 0;
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        // let xStart = 0;
        // let xEnd = this.x.length;

        let columnWidth = areaWidth / columnsOnCanvas;

        let numsPerPixel = areaHeight / ceiling;


        let currentY;
        let currentX = xStartPoint - xOffset;

        ctx.beginPath();

        ctx.lineTo(0, areaHeight);
        for (let x = xStart; x < xEnd + 1; x++) {
            // draw a line and add the corresponding offset, then add that line's height to it
            currentX = help.round((x - xStart) * columnWidth) - xOffset;
            // currentY = yEndPoint - help.round( yArray[i] * numsPerPixel ) - yStartPoint;

            currentY = help.round(areaHeight - (arrayOfOffsets[x] + yArray[x] * numsPerPixel) * areaHeight);
            ctx.lineTo(currentX, currentY);

            // currentX += columnWidth;



            arrayOfOffsets[x] -= yArray[x];
        }
        ctx.lineTo(this.graph.width, areaHeight);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // in every X iteration add to the array of offsets
        // currentOffset - the areaHeight * percentage of all the previous lines
    }

    drawPie(pieceOfPie, pieOffset, color, pieNum){
        // takes

        // takes a percentage value and starting radian
        // draws an arc based on that
        let ctx = this.gCtx;
        let xPos = this.graph.width / 2;
        let yPos = this.graph.height / 2;

        let radius = 120 * pixelRatio;
        let startAngle = pieOffset * Math.PI * 2;
        let endAngle = startAngle + Math.PI * 2 * pieceOfPie;

        if (pieNum == this.selectedPie){
            // ctx.fillStyle = "red";
            xPos = (radius / 5) * Math.cos(startAngle + (endAngle - startAngle) / 2) + xPos;
            yPos = (radius / 5) * Math.sin(startAngle + (endAngle - startAngle) / 2) + yPos;
            // this.selectedPie = null;
        }


        ctx.beginPath();
        ctx.arc(xPos, yPos, radius, startAngle, endAngle);

        // now draw path to center and close path
        ctx.lineTo(xPos, yPos);

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        // draw %% in the middle; font depends on the size
        let fontSize = 16 * pixelRatio * Math.log10(pieceOfPie* 80);
        pieceOfPie = Math.round(pieceOfPie * 100);
        let text = `${pieceOfPie}%`;

        let x = (radius / 2) * Math.cos(startAngle + (endAngle - startAngle) / 2) + xPos;
        let y = (radius / 2) * Math.sin(startAngle + (endAngle - startAngle) / 2) + yPos;
        // let adjustedX = (radius / 2) * Math.cos(startAngle + (endAngle - startAngle) / 2) +
        //     (x - fontSize / 2);
        // let adjustedY = (radius / 2) * Math.sin(startAngle + (endAngle - startAngle) / 2) +
        //     (y + 1);
        x = x - fontSize / 2;
        y = y + fontSize / 2;
        ctx.font = `${fontSize}px Verdana`;
        ctx.fillStyle = "white";
        // ctx.fillText (text, x, adjustedY);
        ctx.fillText (text, x, y);


        // ctx.strokeStyle = color;
        // ctx.stroke();

    }
    drawGraphPopup(currentArrayColumn, currentXPos, convertedYValue, conversionQuotient){
        if (this.mode == "area"){
            this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
            this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);
            this.drawVerticalLine(currentXPos);
        }
        // this.drawCircles(convertedYValue, conversionQuotient, currentXPos, currentArrayColumn);
    }
    popPiePopup(){
        let parameters = this.configureParametersForGraph();

        let left = this.piePopup.getBoundingClientRect().left;
        let top = this.piePopup.getBoundingClientRect().top;
        this.piePopup.style.left = window.event.clientX - left + "px";
        this.piePopup.style.top = window.event.clientY - top + "px";

        let name;
        let style;
        let percentage;
        let sumOfItems = 0;

        let sumOfCurArr = 0;
        let averageOfCurArr = 0;
        for (let i in this.lines){
            if (this.lines[i].isActive){
                for (let x = parameters.xStart; x < parameters.xEnd; x++){
                    sumOfCurArr += this.lines[i]["array"][x];
                }
                averageOfCurArr = sumOfCurArr / (parameters.xEnd = parameters.xStart);
                sumOfItems += averageOfCurArr; //this.lines[i]["array"][currentArrayColumn];
                sumOfCurArr = 0;
            }
        }
        // calc average from start to end
        let sum = 0;
        for (let x = parameters.xStart; x < parameters.xEnd; x++){
            sum += this.lines[this.selectedPie]["array"][x];
        }
        let average = sum / (parameters.xEnd-parameters.xStart);


        name = this.lines[this.selectedPie]["checkboxName"];
        style = `margin: 10px; color: ${this.lines[this.selectedPie]["color"]}`;
        percentage = (Math.round(100 / sumOfItems * average));

        this.piePopup.innerHTML =
            `<div style="${style}"><p class="item"><span class="percentage">${percentage}%</span><span class="name">${name}</span><p class="number">${average}</></div>`;

        // this.piePopup.style.display = "block";
    }
    addItemsToTooltip(currentArrayColumn){
        // Displaying each item
        let number;
        let name;
        let style;
        let percentage;


        // sum all the items in that array
        let sumOfItems = 0;
        for (let i in this.lines){
            if (this.lines[i].isActive){
                sumOfItems += this.lines[i]["array"][currentArrayColumn];

            }
        }



        for (let i in this.lines){
            if (this.lines[i].isActive){
                // get the date
                number = this.lines[i]["array"][currentArrayColumn];
                name = this.lines[i]["checkboxName"];
                style = `margin: 10px; color: ${this.lines[i]["color"]}`;
                percentage = (Math.round(100 / sumOfItems * number));

                this.tooltip.innerHTML +=
                    `<div style="${style}"><p class="item"><span class="percentage">${percentage}%</span><span class="name">${name}</span><p class="number">${number}</></div>`;

            }
        }
    }

    displayTooltip(currentArrayColumn, currentXPos){
        super.displayTooltip(currentArrayColumn, currentXPos);
        let width = this.tooltip.offsetWidth;
        this.tooltip.style.left = currentXPos - width - 50 + "px";

        let left = this.tooltip.offsetLeft;
        if (left < this.graph.offsetLeft) {
            this.tooltip.style.left = currentXPos + 50 + "px";
        }
        // if (left + width > innerWidth){
        //     this.tooltip.style.left = innerWidth - (left + width);
        // }
        if ((left + width) > innerWidth){
            this.tooltip.style.left = innerWidth - (left + width) + "px";
        }

    }
    drawNumbers(){
        let y = this.graph.height - DATESPACE * pixelRatio / 1.5;
        this.iCtx.clearRect(0, 0, this.graph.width, y);
        let rowHeight = (this.graph.height - DATESPACE) / (NUMOFROWS - 1);
        let curNum = 20;
        let rowStep = 20;


        let xPosition = 20;
        this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
        this.iCtx.fillStyle = "white";
        this.iCtx.strokeStyle = "white";

        for (let i=0; i < NUMOFROWS -1; i++){
            this.iCtx.fillText(myMath.formatNumber(curNum, true), xPosition, y - 50);
            curNum += rowStep;
            y -= rowHeight;
        }
        this.iCtx.lineWidth = 1 * pixelRatio;

        this.drawHorizontalLines(rowHeight);
    }
    // drawHorizontalLines(rowHeight){
    //     let drawLines = () =>{
    //         let x = 0;
    //         let xEnd = this.graph.width;
    //         let y = DATESPACE - 21;
    //         for (let i = 0; i < NUMOFROWS; i++){
    //             this.iCtx.moveTo(x, y);
    //             this.iCtx.lineTo(xEnd, y);
    //             y += rowHeight;
    //         }
    //     };
    //     this.iCtx.beginPath();
    //     drawLines();

    //     this.iCtx.globalAlpha = 0.2;
    //     this.iCtx.lineWidth = "2";
    //     this.iCtx.strokeStyle = "grey";
    //     this.iCtx.stroke();
    //     this.iCtx.globalAlpha = 1;
    // }
    drawDates(parameters){
        if (this.mode == "pie"){
            let dateStart = new Date(this.x[parameters.xStart]);
            dateStart = MONTHS[dateStart.getMonth()] + ' ' + dateStart.getDate();

            let dateEnd = new Date(this.x[parameters.xEnd]);
            dateEnd = MONTHS[dateEnd.getMonth()] + ' ' + dateEnd.getDate();
            this.periodText.textContent = `${dateStart} - ${dateEnd}`;

        } else {
            super.drawDates(parameters);
        }
    }
    animation(parameters, oldPercentLines, newPercentLines, arrayOfOffsets){
        let arrayOfDistributedDifferences;
        // take values from first
        // note that it's an array of arrays; also that i cannot mutate the old one or new one
        let clonedNewPercentLines = myMath.cloneNestedArray(newPercentLines);
        myMath.subtractSecondNestedFromFirst(clonedNewPercentLines, oldPercentLines);
        // now that the clone is the difference, divide it by num of frames
        myMath.divideNestedArrayByNum(clonedNewPercentLines, NUMOFFRAMES);
        arrayOfDistributedDifferences = clonedNewPercentLines;

        // so i can mutate it during animation
        let clonedOldPercentLines = myMath.cloneNestedArray(oldPercentLines);

        let currentFrame = 1;
        this.drawAreaAnimation(parameters, currentFrame, clonedOldPercentLines, arrayOfOffsets,
                          arrayOfDistributedDifferences);
    }
    drawAreaAnimation(parameters, currentFrame, oldPercentLines, arrayOfOffsets,
                      arrayOfDistributedDifferences){
        // currentArray = Old * distributedDifference;

        if (currentFrame < NUMOFFRAMES){
            requestAnimationFrame(() => {
                this.drawAreaAnimation(parameters, currentFrame, oldPercentLines, arrayOfOffsets,
                                  arrayOfDistributedDifferences);
            });


            // cloning array of offsets before animation so it doesn't mutate it
            let clonedArrayOfOffsets = [...arrayOfOffsets];
            this.sendAllActiveToDrawArea(parameters, oldPercentLines, clonedArrayOfOffsets); // NOTE maybe clone

            // add distributed difference to the old array
            myMath.addSecondNestedArrayToFirst(oldPercentLines, arrayOfDistributedDifferences);
            currentFrame += 1;
        } else {
            this.justBeenRemoved = null;
            this.justBeenSelected = null;
            this.animationActive = false;
            if (this.mode == "area"){
                this.drawGraph();
            }
            this.drawMinimap();
        }
    }

}







//create an xhr, load overview
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
// LEGACY CHARTS FROM STAGE 1
// initiateCharts();

// initiate each chart; also appends each to arrayOfNewCharts
for (let c = 1; c <= 5; c++) {
    initiateNewCharts(c);
}
putThemeButton();
switchTheme();