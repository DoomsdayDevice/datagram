export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const NUM_OF_ROWS = 6; // how many numbers should be displayed on the left
export const PIXEL_RATIO = window.devicePixelRatio || 1;
export const DATE_SPACE = 23 * PIXEL_RATIO; // the space left to display the dates
export const NUM_OF_FRAMES = 16;

export const NIGHT = {
  lead: '#1d2733'
};
export const DAY = {
  lead: 'rgb(255, 255, 255)'
};

export const SETTINGS = {
  minimapHeight: 50,
  canvasWidth: innerWidth < 992 ? innerWidth : 992,
  canvasHeight: 300,

  minSliderWidth: 50,
  fontSize: 16 * PIXEL_RATIO
};

export const myMath = {
  round(number) {
    // PARENTS: Chart.drawLine() drawText()
    return Math.round(number * 10) / 10;
  },

  calcXPositionOnCanvas() {
    // TODO implement this; uses xFactor and stuff in both text, line and nums
  },

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  },

  findPrettyRoundNum(max) {
    max *= 1.1; // make it a bit higher so there's some space above
    let currentNumber = NUM_OF_ROWS;
    let index = 0;
    let prettyNum = currentNumber;
    while (currentNumber < max / NUM_OF_ROWS) {
      prettyNum = currentNumber;
      if (currentNumber.toString()[0] == '5') {
        currentNumber *= 2;
      } else {
        currentNumber *= 5;
      }
    }
    // rounding to the pretty number: divide by it, floor, *
    let rounded = Math.ceil(max / prettyNum) * prettyNum;

    return rounded;
  },
  findMaxInArray(array) {
    return Math.max(...array);
  },

  addSecondArrayToFirst(array1, array2) {
    for (let i = 0; i < array1.length; i++) {
      array1[i] += array2[i];
    }
  },
  formatNumber(n) {
    const abs = Math.abs(n);
    if (abs > 1000000000) return (n / 1000000000).toFixed(2) + 'B';
    if (abs > 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (abs > 1000) return (n / 1000).toFixed(1) + 'K';

    if (abs > 1) {
      let s = abs.toFixed(0);
      let formatted = n < 0 ? '-' : '';
      for (let i = 0; i < s.length; i++) {
        formatted += s.charAt(i);
        if ((s.length - 1 - i) % 3 === 0) formatted += ' ';
      }
      return formatted;
    }

    return n.toString();
  },
  nestedArraysAreEqual(array1, array2) {
    // assuming same length
    return array1.every((arr, i) => myMath.arraysAreEqual(arr, array2[i]));
  },
  arraysAreEqual(array1, array2) {
    // assuming same length
    return array2 ? array1.every((elem, i) => array2[i] === elem) : false;
  },
  subtractSecondNestedFromFirst(array1, array2) {
    for (let x = 0; x < array1.length; x++) {
      myMath.subtractSecondFromFirst(array1[x], array2[x]);
    }
  },
  subtractSecondFromFirst(array1, array2) {
    for (let x = 0; x < array1.length; x++) {
      array1[x] -= array2[x];
    }
  },

  divideNestedArrayByNum(array1, num) {
    for (let x = 0; x < array1.length; x++) {
      myMath.divideArrayByNum(array1[x], num);
    }
  },
  divideArrayByNum(array1, num) {
    for (let x = 0; x < array1.length; x++) {
      array1[x] /= num;
    }
  },
  cloneNestedArray(nestedArray) {
    return nestedArray.map(arr => [...arr]);
  },
  addSecondNestedArrayToFirst(array1, array2) {
    for (let x = 0; x < array1.length; x++) {
      myMath.addSecondArrayToFirst(array1[x], array2[x]);
    }
  }
};

export function detectMobile() {
  if (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
  ) {
    return true;
  } else {
    return false;
  }
}
