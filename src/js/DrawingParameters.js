export default class DrawingParameters{
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
