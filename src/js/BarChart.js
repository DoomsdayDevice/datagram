import Chart from './Chart.js';
import {
  // MONTHS,
  // DAYS_OF_WEEK,
  // NUM_OF_ROWS,
  // PIXEL_RATIO,
  DATE_SPACE,
  // NUM_OF_FRAMES,
  myMath,
  // NIGHT,
  // DAY,
  // SETTINGS,
  // myMath
} from './utils.js';

export default class BarChart extends Chart{
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
    let fillDistance = areaHeight - DATE_SPACE - currentY - currentOffset; // on the Y axis
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
      currentY = yEndPoint - myMath.round( yArray[x] * numsPerPixel )
        - yStartPoint - currentOffset;
      currentX = myMath.round((x - xStart) * columnWidth) - xOffset;

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
