import BarChart from './BarChart.js';
import {
  // MONTHS,
  // DAYS_OF_WEEK,
  // NUM_OF_ROWS,
  PIXEL_RATIO,
  DATE_SPACE,
  // NUM_OF_FRAMES,
  // help,
  // NIGHT,
  // DAY,
  // SETTINGS,
  myMath
} from './utils.js';

export default class StackedBarChart extends BarChart{
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
    this.displayTooltip(currentArrayColumn, currentXPos / PIXEL_RATIO);

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
