export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const NUMOFROWS = 6; // how many numbers should be displayed on the left
export const pixelRatio = window.devicePixelRatio || 1;
export const DATESPACE = 23 * pixelRatio; // the space left to display the dates
export const NUMOFFRAMES = 16;
export const help = {
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

export const NIGHT = {
    lead: "#1d2733"
};
export const DAY = {
    lead: "rgb(255, 255, 255)"
};


export const SETTINGS = {
    minimapHeight: 50,
    canvasWidth: innerWidth < 992 ? innerWidth : 992,
    canvasHeight: 300,

    minSliderWidth: 50,
    fontSize: 16 * pixelRatio

};

export const myMath = {
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
    },
    formatNumber(n){
        let abs = Math.abs(n);
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
    arraysOfArraysAreEqual(array1, array2){ // assuming same length
        for (let x = 0; x < array1.length; x++){
            if(!myMath.arraysAreEqual(array1[x], array2[x])){
                return false;
            }
        }
        return true;
    },
    arraysAreEqual(array1, array2){ // assuming same length
        if(!array2){
            return false;
        }
        for (let x = 0; x < array1.length; x++){
            if (array1[x] != array2[x]){return false;};
        }
        return true;
    },
    subtractSecondNestedFromFirst(array1, array2){
        for(let x = 0; x < array1.length; x++){
            myMath.subtractSecondFromFirst(array1[x], array2[x]);
        }
    },
    subtractSecondFromFirst(array1, array2){
        for(let x = 0; x < array1.length; x++){
            array1[x] -= array2[x];
        }

    },

    divideNestedArrayByNum(array1, num){
        for(let x = 0; x < array1.length; x++){
            myMath.divideArrayByNum(array1[x], num);
        }
    },
    divideArrayByNum(array1, num){
        for (let x = 0; x < array1.length; x++){
            array1[x] /= num;
        }
    },
    cloneNestedArray(array){
        let clone = [];
        for (let x = 0; x < array.length; x++){
            clone.push([...array[x]]);
        }
        return clone;

    },
    addSecondNestedArrayToFirst(array1, array2){
        for(let x = 0; x < array1.length; x++){
            myMath.addSecondArrayToFirst(array1[x], array2[x]);
        }
    }
};
