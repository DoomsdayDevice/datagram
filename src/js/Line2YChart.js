import Chart from './Chart.js';
import {
  // SETTINGS,
  PIXEL_RATIO,
  DATE_SPACE,
  myMath,
  // NUM_OF_ROWS,
  NUM_OF_FRAMES,
  // help,
  // MONTHS,
  // DAYS_OF_WEEK,
  // DAY,
  // NIGHT
} from './utils.js';

export default class Line2YChart extends Chart{
  constructor(data){
    let title = "2 Y-Axes Chart";
    super(data, title);

    // VARS
    this.oldCeilingFirst = 0;
    this.oldCeilingSecond = 0;

    this.drawNumbers(this.configureParametersForGraphFirst().ceiling, 1, NUM_OF_FRAMES);
    this.drawNumbers(this.configureParametersForGraphSecond().ceiling, 1, NUM_OF_FRAMES, "R");
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
    let currentNumOfFrames = NUM_OF_FRAMES;

    let differenceFirst = currentFutureCeilingFirst - currentOldCeilingFirst;
    let distributedDifferenceFirst = differenceFirst / NUM_OF_FRAMES;
    let differenceSecond = currentFutureCeilingSecond - currentOldCeilingSecond;
    let distributedDifferenceSecond = differenceSecond / NUM_OF_FRAMES;

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
    //     // parameters.ctx.globalAlpha = 1 / NUM_OF_FRAMES * parameters.currentFrame;
    // } else if (this.lines[i] == this.justBeenRemoved && parameters.onButtonPress){
    //     // parameters.ctx.globalAlpha = 1 - 1 / NUM_OF_FRAMES * parameters.currentFrame;
    // }

    if (this.lines[0].isActive || this.lines[0] == this.justBeenRemoved){
      if (this.lines[0] == this.justBeenSelected && parametersFirst.onButtonPress){
        parametersFirst.ctx.globalAlpha = 1 / NUM_OF_FRAMES * parametersFirst.currentFrame;
      } else if (this.lines[0] == this.justBeenRemoved && parametersFirst.onButtonPress) {
        parametersFirst.ctx.globalAlpha = 1 - 1 / NUM_OF_FRAMES * parametersFirst.currentFrame;
      }
      this.drawLine2Y(parametersFirst);
    }
    parametersFirst.ctx.globalAlpha = 1;

    if (this.lines[1].isActive || this.lines[1] == this.justBeenRemoved){
      if (this.lines[1] == this.justBeenSelected && parametersSecond.onButtonPress){
        parametersFirst.ctx.globalAlpha = 1 / NUM_OF_FRAMES * parametersFirst.currentFrame;
      } else if (this.lines[1] == this.justBeenRemoved && parametersFirst.onButtonPress) {
        parametersFirst.ctx.globalAlpha = 1 - 1 / NUM_OF_FRAMES * parametersFirst.currentFrame;
      }
      this.drawLine2Y(parametersSecond);
    }
    parametersFirst.ctx.globalAlpha = 1;
  }
  drawAnimation2Y(parametersFirst, parametersSecond, currentOldCeilingFirst,
                  currentOldCeilingSecond, distributedDifferenceFirst,
                  distributedDifferenceSecond, currentFrame, currentFutureCeilingFirst,
                  currentFutureCeilingSecond){
    if (currentFrame <= NUM_OF_FRAMES) {
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
      this.drawNumbers(currentFutureCeilingFirst, 1, NUM_OF_FRAMES);
      this.drawNumbers(currentFutureCeilingSecond, 1, NUM_OF_FRAMES, "R");

    }
  };
  drawCircles(conversionQuotient, currentXPos, currentArrayColumn){
    // drawing the circles for each line based on its configuration
    let convertedYValue;
    let ceilingFirst = this.configureParametersForGraphFirst().ceiling;
    let ceilingSecond = this.configureParametersForGraphSecond().ceiling;
    let conversionQuotientFirst = (this.graph.height - DATE_SPACE) / ceilingFirst;
    let conversionQuotientSecond = (this.graph.height - DATE_SPACE) / ceilingSecond;

    let convertedYValueFirst =
        this.graph.height - this.lines[0]["array"][currentArrayColumn] *
        conversionQuotientFirst - DATE_SPACE;
    let convertedYValueSecond =
        this.graph.height - this.lines[1]["array"][currentArrayColumn] *
        conversionQuotientSecond - DATE_SPACE;
    for (let i in this.lines){
      if (this.lines[i].isActive){

        if (i == 0){
          convertedYValue = convertedYValueFirst;
        } else {
          convertedYValue = convertedYValueSecond;
        }


        this.pCtx.beginPath();
        this.pCtx.arc(currentXPos, convertedYValue,
                      6 * PIXEL_RATIO, 0, Math.PI * 2);
        this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
        this.pCtx.strokeStyle = this.lines[i]["color"];
        this.pCtx.fill();
        this.pCtx.lineWidth = 2 * PIXEL_RATIO;
        this.pCtx.stroke();
        this.pCtx.fillStyle = "black";


      }
    }

  };
}
