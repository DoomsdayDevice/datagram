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
