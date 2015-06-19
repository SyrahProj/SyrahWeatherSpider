var net = require('net');
var http = require('http');
var fs = require('fs');

var port = 14580;
var host = 'hangzhou.aprs2.net';
var user = 'user BG5ZZZ-89 pass 24229 ver Jia\n';
var filter = '#filter t/w\n';

var client = new net.Socket();

var countReceived = 0;
var errCountParse = 0;

var countPost = 0;
var errCountPost = 0;

client.connect(port, host, function() {
  client.write(user);
  client.write(filter);
});

client.on('data', function(data) {

  var dataReceived = data.toString().split('\n')
  for (var i = 0; i < dataReceived.length; i++) {
    if (dataReceived[i] == '') {
      continue;
    }

    var countString = parseInt(countReceived++) + ': ';
    fs.appendFile('./Received.log', countString + dataReceived[i] + '\n', 'utf-8', function(err) {
      if (err)
        console.log('write File err: ' + err);
    })

    try {
      var dataToBePosted = dataSplit(dataReceived[i]);
      if (dataToBePosted != undefined) {
        //write parsedData to log
        fs.appendFile('./parsed.log', countString + JSON.stringify(dataToBePosted) + '\n', 'utf-8', function(err) {
          if (err) {
            console.log(err);
          }
        });
        //post Data

        postData(dataToBePosted);

      }
    } catch (err) {
      console.log('err occured');
      console.log(err);
      //write to error log
      var errCountString = parseInt(++errCountParse) + ': ';
      fs.appendFile('./Error.log', errCountString + dataReceived[i] + '\n', 'utf-8', function(err) {
        if (err)
          console.log(err);
      });

    }
  }

});

function postData(dataToPost) {
  //console.log(dataToPost);
  var dataString = JSON.stringify({
    data: dataToPost,
    cnt: ++countPost
  });
  //console.log(dataString);
  var opts = {
    host: "localhost",
    port: 3000,
    path: '/testingPost',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    }
  };

  var req = http.request(opts, function(feedback) {
    //console.log("whatever");
  });

  req.on('error', function(err) {
    console.log('problem with request:' + err);
    console.log(++errCountPost + "/" + countPost);
  });

  req.write(dataString, function(feedback) {
    //console.log('shit sent');
  });
  req.end();

}

function dataSplit(data) {
  if (data.charAt(0) != '#' && data.charAt(0) != '') {

    var positionOfFlag = data.indexOf(':');

    if (data != '') {
      if (positionOfFlag == -1) {
        throw new Error("Error");
      }
    } else {
      throw new Error("Error");
    }


    var dataStr = new Array;
    dataStr[0] = data.substring(0, positionOfFlag);
    dataStr[1] = data.substring(positionOfFlag + 1);

    var weatherType = dataStr[1].charAt(0);

    // Begin to deal with the weather data
    var ObjName;
    var time;
    var latitute;
    var longitude;
    var windInfo;
    var compressedWindInfo;
    var WeatherData;
    var SoftwareIdentifier;
    var MachineIdentifier;

    switch (weatherType) {

      case '@':
        // console.log("Type is @");
        var newWeatherData;
        if (dataStr[1].charAt(16) == '/') {
          //Complete Weather data with Lat/Long and Time Stamp
          time = dataStr[1].substring(1, 8);
          latitute = dataStr[1].substring(8, 16);
          longitude = dataStr[1].substring(17, 26);
          windInfo = dataStr[1].substring(27, 34);
          compressedWindInfo = '';
          WeatherData = dataStr[1].substring(34, dataStr[1].length);
        } else {
          //Complete Weather data with Compressed Lat/Long and Time Stamp
          time = dataStr[1].substring(1, 8);
          latitute = dataStr[1].substring(9, 13);
          longitude = dataStr[1].substring(13, 17);
          compressedWindInfo = dataStr[1].substring(18, 20);
          windInfo = '';
          WeatherData = dataStr[1].substring(21, dataStr[1].length);
        }

        //Deal with Identifier
        dealWithSoftIdentifier(WeatherData);

        //Deal with data to be returned
        var newObj = dealWithSoftIdentifier(WeatherData);
        WeatherData = newObj.weather;
        MachineIdentifier = newObj.machine;

        break;

      case '/':
        var newWeatherData;
        if (dataStr[1].charAt(16) == '/') {
          //Complete Weather data with Lat/Long and Time Stamp
          time = dataStr[1].substring(1, 8);
          latitute = dataStr[1].substring(8, 16);
          longitude = dataStr[1].substring(17, 26);
          windInfo = dataStr[1].substring(27, 34);
          compressedWindInfo = '';
          WeatherData = dataStr[1].substring(34, dataStr[1].length);
        } else {
          //Complete Weather data with Compressed Lat/Long and Time Stamp
          time = dataStr[1].substring(1, 8);
          latitute = dataStr[1].substring(9, 13);
          longitude = dataStr[1].substring(13, 17);
          compressedWindInfo = dataStr[1].substring(18, 20);
          windInfo = '';
          WeatherData = dataStr[1].substring(21, dataStr[1].length);
        }

        dealWithSoftIdentifier(WeatherData);

        var newObj = dealWithSoftIdentifier(WeatherData);
        WeatherData = newObj.weather;
        MachineIdentifier = newObj.machine;

        break;

      case '!':
        var newWeatherData;
        if (dataStr[1].charAt(2) != '!') {
          if (dataStr[1].charAt(9) == '/') {
            //Complete Weather data with Lat/Long and NO Time Stamp
            time = '';
            ObjName = '';
            latitute = dataStr[1].substring(1, 9);
            longitude = dataStr[1].substring(10, 19);
            windInfo = dataStr[1].substring(21, 28);
            compressedWindInfo = '';
            WeatherData = dataStr[1].substring(28, dataStr[1].length);
          } else {
            //Complete Weather data with Compressed Lat/Long and NO Time Stamp
            time = '';
            ObjName = '';
            latitute = dataStr[1].substring(2, 6);
            longitude = dataStr[1].substring(6, 10);
            compressedWindInfo = dataStr[1].substring(11, 13);
            windInfo = '';
            WeatherData = dataStr[1].substring(14, dataStr[1].length);
          }

          dealWithSoftIdentifier(WeatherData);
          var newObj = dealWithSoftIdentifier(WeatherData);
          WeatherData = newObj.weather;
          MachineIdentifier = newObj.machine;


        } else {
          var rawWeatherData = dataStr[1].substring(1, dataStr[1].length);
        }
        break;

      case '=':
        //   console.log("Type is =");
        var newWeatherData;
        if (dataStr[1].charAt(9) == '/') {
          //Complete Weather data with Lat/Long and NO Time Stamp
          time = '';
          ObjName = '';
          latitute = dataStr[1].substring(1, 9);
          longitude = dataStr[1].substring(10, 19);
          windInfo = dataStr[1].substring(20, 27);
          compressedWindInfo = '';
          WeatherData = dataStr[1].substring(27, dataStr[1].length);
        } else {
          //Complete Weather data with Compressed Lat/Long and NO Time Stamp
          time = '';
          ObjName = '';
          latitute = dataStr[1].substring(2, 6);
          longitude = dataStr[1].substring(6, 10);
          compressedWindInfo = dataStr[1].substring(11, 13);
          windInfo = '';
          WeatherData = dataStr[1].substring(14, dataStr[1].length);
        }

        dealWithSoftIdentifier(WeatherData);
        var newObj = dealWithSoftIdentifier(WeatherData);
        WeatherData = newObj.weather;
        MachineIdentifier = newObj.machine;

        break;

      case ';':

        var newWeatherData;
        ObjName = dataStr[1].substring(1, 10);
        if (dataStr[1].charAt(17) == 'z') {
          time = dataStr[1].substring(11, 18);
          latitute = dataStr[1].substring(18, 26);
          longitude = dataStr[1].substring(27, 36);
          windInfo = dataStr[1].substring(37, 44);
          compressedWindInfo = '';
          WeatherData = dataStr[1].substring(44, dataStr[1].length);
        } else {
          time = '';
          latitute = dataStr[1].substring(11, 19);
          longitude = dataStr[1].substring(20, 29);
          windInfo = dataStr[1].substring(30, 37);
          compressedWindInfo = '';
          WeatherData = dataStr[1].substring(37, dataStr[1].length);
        }

        var newObj = dealWithSoftIdentifier(WeatherData);
        WeatherData = newObj.weather;
        MachineIdentifier = newObj.machine;


        break;
      case '#':
        //  console.log("Type is #");
        rawWeatherData = dataStr[1].substring(1, dataStr[1].length);

        time = '';
        ObjName = '';
        latitute = '';
        longitude = '';
        compressedWindInfo = '';
        windInfo = '';
        WeatherData = '';
        break;
      case '$':
        rawWeatherData = dataStr[1].substring(1, dataStr[1].length);

        time = '';
        ObjName = '';
        latitute = '';
        longitude = '';
        compressedWindInfo = '';
        windInfo = '';
        WeatherData = '';
        break;
      case '*':
        rawWeatherData = dataStr[1].substring(1, dataStr[1].length);

        time = '';
        ObjName = '';
        latitute = '';
        longitude = '';
        compressedWindInfo = '';
        windInfo = '';
        WeatherData = '';
        break;
      case '_':
        var rawWeatherData = dataStr[1].substring(10, dataStr[1].length);

        time = rawWeatherData.substring(0, 7);
        ObjName = '';
        latitute = '';
        longitude = '';
        compressedWindInfo = '';
        windInfo = '';
        WeatherData = rawWeatherData.substring(8, rawWeatherData.length);

        //Deal with raw weather data

        break;
      default: //console.log(weatherType);
        time = '';
        ObjName = '';
        latitute = '';
        longitude = '';
        compressedWindInfo = '';
        windInfo = '';
        WeatherData = '';
        break;
    }

    //Start to make up an object
    var weatherDataGroup = {

        objNameConverted: ObjName,
        TimeConverted: time,
        latituteConverted: latitute,
        longitudeConverted: longitude,
        windInfoConverted: windInfo,
        compressedWindInfoConverted: compressedWindInfo,
        WeatherDataConverted: WeatherData,
        SoftwareIdentifierConverted: SoftwareIdentifier,
        MachineIdentifierConverted: MachineIdentifier
      }
      //Object Made
    var receivedObject = dataDecoding(weatherDataGroup);
	receivedObject.pathData = dealWithPath(dataStr[0]);
  }
	
	

  return receivedObject;
}

function dataDecoding(DataConvertedGroup) {
  var tarData = new Object();
  tarData.Type = 0;
  // 0 - undefine ; 1 - DayHrMin(UTC/GMT) z ; 2 - DayHrMin(Local) / ; 3 HrMinSec(UTC/GMT) h ; 4 MonDayHrMin(UTC/GMT)
  tarData.Year = 0;
  tarData.Month = 0;
  tarData.Day = 0;
  tarData.Hour = 0;
  tarData.Min = 0;
  tarData.Sec = 0;
  tarData.Dates = "";
  tarData.Times = "";

  //Split Time
  tStr = DataConvertedGroup.TimeConverted;
  if (tStr.length == 7) {
    tail = tStr.charAt(6);
    var d = new Date();
    //console.log(tail);
    switch (tail) {
      case 'z':
        tarData.Type = 1;
	tarData.Year = d.getUTCFullYear();
        tarData.Month = d.getUTCMonth() + 1;
        tarData.Day = parseInt(tStr.slice(0, 2));
        tarData.Hour = parseInt(tStr.slice(2, 4));
        tarData.Min = parseInt(tStr.slice(4, 6));
        break;
      case '/':
        tarData.Type = 2;
	tarData.Year = d.getFullYear();
        tarData.Month = d.getMonth() + 1;
        tarData.Day = parseInt(tStr.slice(0, 2));
        tarData.Hour = parseInt(tStr.slice(2, 4));
        tarData.Min = parseInt(tStr.slice(4, 6));
        break;
      case 'h':
        tarData.Type = 3;
	tarData.Year = d.getUTCFullYear();
	tarData.Month = d.getUTCMonth() + 1;
	tarData.Day = d.getUTCDate();
        tarData.Hour = parseInt(tStr.slice(0, 2));
        tarData.Min = parseInt(tStr.slice(2, 4));
        tarData.Sec = parseInt(tStr.slice(4, 6));
        break;
    }
  } else if (tStr.length == 8) {
    tarData.Type = 4;
    tarDate.Year = d.getUTCFullYear();
    tarData.Month = parseInt(tStr.slice(0, 2));
    tarData.Day = parseInt(tStr.slice(2, 4));
    tarData.Hour = parseInt(tStr.slice(4, 6));
    tarData.Min = parseInt(tStr.slice(6, 8));
  } else {
    //console.log('Unknown Data');
    //console.log(tStr);
  }

  tarData.Dates = tarData.Year + '-' + tarData.Month + '-' + tarData.Day;
  tarData.Times = tarData.Hour + ':' + tarData.Min + ':' + tarData.Sec;

  //Latitude
  tLat = DataConvertedGroup.latituteConverted;
  if (tLat.length == 4) {
    //y1 = (tLat.charCodeAt(0)-33) * (91*91*91);
    //y2 = (tLat.charCodeAt(1)-33) * (91*91);
    //y3 = (tLat.charCodeAt(2)-33) * (91);
    //y4 = (tLat.charCodeAt(3)-33) * (1);
    //tarData.Lat =  90 - (y1 + y2 + y3 + y4) / 380926;.
    tarData.Lat = decodeLat(tLat);
  } else {
    if (tLat.slice(7, 8) == 'N') {
      correct = parseInt(tLat.slice(0, 2));
      correct = correct + parseFloat(tLat.slice(2, 7)) / 60;
      tarData.Lat = correct;
    } else {
      correct = 0 - tLat.slice(0, 2);
      correct = correct - parseFloat(tLat.slice(2, 7)) / 60;
      tarData.Lat = correct;
    }
  }

  //Longtitude
  tLong = DataConvertedGroup.longitudeConverted;
  if (tLong.length == 4) {
    //x1 = (tLong.charCodeAt(0)-33) * (91*91*91);
    //x2 = (tLong.charCodeAt(1)-33) * (91*91);
    //x3 = (tLong.charCodeAt(2)-33) * (91);
    //x4 = (tLong.charCodeAt(3)-33) * (1);
    //tarData.Long =  -180 + (x1 + x2 + x3 + x4) / 190463;
    tarData.Long = decodeLong(tLong);
  } else {
    if (tLong.slice(8, 9) == 'E') {
      correct = parseInt(tLong.slice(0, 3));
      correct = correct + parseFloat(tLong.slice(3, 8)) / 60;
      tarData.Long = correct;
    } else {
      correct = 0 - tLong.slice(0, 3);
      correct = correct - parseFloat(tLong.slice(3, 8)) / 60;
      tarData.Long = correct;
    }
  }

  var res = new Object();
  res.WeatherStr = DataConvertedGroup.WeatherDataConverted; //"c...s   g005t077r000p000P000h50b09900";
  res.WindDir_Speed = DataConvertedGroup.windInfoConverted; //"220/004";
  res.CompWindDir_Speed = DataConvertedGroup.compressedWindInfoConverted; //"7P";

  //Split WeatherStr
  wStr = res.WeatherStr;
  var extraStr = new Object();
  extraStr.WindDir_Speed = "";
  extraStr.CompWindDir_Speed = "";
  if (res.WindDir_Speed == "") extraStr.WindDir_Speed = "";
  else extraStr.WindDir_Speed = res.WindDir_Speed;
  if (res.CompWindDir_Speed == '') extraStr.CompWindDir_Speed = "";
  else extraStr.CompWindDir_Speed = res.CompWindDir_Speed;

  //WindDirection
  tarData.WindDirection = parseInt(wStr.slice(wStr.indexOf('c') + 1, wStr.indexOf('c') + 4)); // degrees
  if (tarData.WindDirection == "..." || tarData.WindDirection == "   ") tarData.WindDirection = 0;
  if (tarData.WindDirection == wStr.slice(0, 3)) tarData.WindDirection = 0;
  if (extraStr.WindDir_Speed != "") tarData.WindDirection = parseInt(extraStr.WindDir_Speed.slice(0, 3));
  if (extraStr.CompWindDir_Speed != '') {
    if (extraStr.CompWindDir_Speed.charAt(0) >= '!' && extraStr.CompWindDir_Speed.charAt(0) <= 'z') {
      //tarData.WindDirection = (extraStr.CompWindDir_Speed.charCodeAt(0) - 33) * 4;
      tarData.WindDirection = decodeCourse(extraStr.CompWindDir_Speed.charAt(0));
    }
  }

  //WindSpeed
  tarData.WindSpeed = parseInt(wStr.slice(wStr.indexOf('s') + 1, wStr.indexOf('s') + 4)); // mph
  if (tarData.WindSpeed == "..." || tarData.WindSpeed == "   ") tarData.WindSpeed = 0;
  if (tarData.WindSpeed == wStr.slice(0, 3)) tarData.WindSpeed = 0;
  if (extraStr.WindDir_Speed != "") tarData.WindSpeed = parseInt(extraStr.WindDir_Speed.slice(4, 7));
  if (extraStr.CompWindDir_Speed != "") {
    if (extraStr.CompWindDir_Speed.charAt(0) >= '!' && extraStr.CompWindDir_Speed.charAt(0) <= 'z') {
      //pow = 1.00;  eFlag = extraStr.CompWindDir_Speed.charCodeAt(1) - 33;
      //for(i=1; i<= eFlag; i++) pow = pow * 1.08;
      //tarData.WindSpeed = pow - 1;
      tarData.WindDirection = decodeSpeed(extraStr.CompWindDir_Speed.charAt(1)) * 1.151; //knot -> mph
    }
  }

  //AprsSoftware & WeatherUnit
  res.AprsSoft = DataConvertedGroup.SoftwareIdentifierConverted;
  aStr = res.AprsSoft;
  res.WeatherUnit = DataConvertedGroup.MachineIdentifierConverted;
  uStr = res.WeatherUnit;
  switch (aStr) {
    case "d":
      tarData.AprsSoft = "APRSdos";
      break;
    case "M":
      tarData.AprsSoft = "MacAPRS";
      break;
    case "P":
      tarData.AprsSoft = "pocketAPRS";
      break;
    case "S":
      tarData.AprsSoft = "APRS+SA";
      break;
    case "W":
      tarData.AprsSoft = "WinAPRS";
      break;
    case "X":
      tarData.AprsSoft = "X-APRS (Linux)";
      break;
    default:
      tarData.AprsSoft = res.AprsSoft;
  }

  switch (uStr) {
    case "Dvs":
      tarData.WeatherUnit = "Davis";
      break;
    case "HKT":
      tarData.WeatherUnit = "Heathkit";
      break;
    case "PIC":
      tarData.WeatherUnit = "PIC device";
      break;
    case "RSW":
      tarData.WeatherUnit = "Radio Shack";
      break;
    case "￼U-II":
      tarData.WeatherUnit = "Original Ultimeter U-II (auto mode)";
      break;
    case "￼￼￼U2R":
      tarData.WeatherUnit = "Original Ultimeter U-II (remote mode)";
      break;
    case "￼U2k￼￼￼":
      tarData.WeatherUnit = "Ultimeter 500/2000";
      break;
    case "U2kr":
      tarData.WeatherUnit = "Remote Ultimeter logger";
      break;
    case "￼U5￼￼￼":
      tarData.WeatherUnit = "Ultimeter 500";
      break;
    case "Upkm":
      tarData.WeatherUnit = "Remote Ultimeter packet mode";
      break;
    default:
      tarData.WeatherUnit = res.WeatherUnit;
  }


  //Gust
  tarData.Gust = parseInt(wStr.slice(wStr.indexOf('g') + 1, wStr.indexOf('g') + 4)); // mph (peak speed in the last 5min)
  if (tarData.Gust == "..." || tarData.Gust == "   ") tarData.Gust = 0;
  if (tarData.Gust == wStr.slice(0, 3)) tarData.Gust = 0;
  //Temp
  tarData.Temp = parseInt(wStr.slice(wStr.indexOf('t') + 1, wStr.indexOf('t') + 4)); // degrees Fahrenheit
  if (tarData.Temp == "..." || tarData.Temp == "   ") tarData.Temp = 0;
  if (tarData.Temp == wStr.slice(0, 3)) tarData.Temp = 0;
  //RainLastHr
  tarData.RainLastHr = parseInt(wStr.slice(wStr.indexOf('r') + 1, wStr.indexOf('r') + 4)); // hundredths of an inch
  if (tarData.RainLastHr == wStr.slice(0, 3)) tarData.RainLastHr = 0;
  //if(tarData.RainLastHr == wStr.slice(0, 3)) tarData.RainLastHr = 0;
  //RainLast24Hr
  tarData.RainLast24Hr = parseInt(wStr.slice(wStr.indexOf('p') + 1, wStr.indexOf('p') + 4));
  if (tarData.RainLast24Hr == wStr.slice(0, 3)) tarData.RainLast24Hr = 0;
  //if(tarData.RainLast24Hr == wStr.slice(0, 3)) tarData.RainLast24Hr = 0;
  //RainSinceMid
  tarData.RainSinceMid = parseInt(wStr.slice(wStr.indexOf('P') + 1, wStr.indexOf('P') + 4));
  if (tarData.RainSinceMid == wStr.slice(0, 3)) tarData.RainSinceMid = 0;
  //if(tarData.RainSinceMid == wStr.slice(0, 3)) tarData.RainSinceMid = 0;
  //Humidity
  tarData.Humidity = parseInt(wStr.slice(wStr.indexOf('h') + 1, wStr.indexOf('h') + 3)); // in %.00 = 100%
  if (tarData.Humidity == wStr.slice(0, 2)) tarData.Humidity = 0;
  //if(tarData.Humidity == wStr.slice(0, 3)) tarData.Humidity = 0;
  //Barometric
  tarData.Barometric = parseInt(wStr.slice(wStr.indexOf('b') + 1, wStr.indexOf('b') + 5));
  if (tarData.Barometric == wStr.slice(0, 4)) tarData.Barometric = 0;
  //if(tarData.Barometric == wStr.slice(0, 3)) tarData.Barometric = 0;
  tarData.Luminosity = parseInt(wStr.slice(wStr.indexOf('L') + 1, wStr.indexOf('L') + 4));
  if (tarData.Luminosity == wStr.slice(0, 3)) tarData.Luminosity = 0;
  // in watts per meter^2 <= 999
  //wea.Luminosity2 = wStr.slice(wStr.indexOf('l')+1, wStr.indexOf('l')+4);
  //wea.SnowfallLast24Hr = wStr.slice(wStr.indexOf('s')+1, wStr.indexOf('s')+4);  //in inches
  //wea.RawRainCounter = wStr.slice(wStr.indexOf('#')+1, wStr.indexOf('#')+4);
  //console.log(tarData);
  return tarData;
}

function decodeLat(lat) {
  var lat_final = 90 - ((lat.charCodeAt(0) - 33) * Math.pow(91, 3) + (lat.charCodeAt(1) - 33) * Math.pow(91, 2) + (lat.charCodeAt(2) - 33) * 91 + lat.charCodeAt(3) - 33) / 380926;
  return lat_final;
}

function decodeLong(long) {
  var long_final = -180 + ((long.charCodeAt(0) - 33) * Math.pow(91, 3) + (long.charCodeAt(1) - 33) * Math.pow(91, 2) + (long.charCodeAt(2) - 33) * 91 + long.charCodeAt(3) - 33) / 190463;
  return long_final;
}

function decodeCourse(c) {
  var course_final = (c.charCode - 33) * 4;
  return course_final;
}

function decodeSpeed(s) {
  var speed_final = Math.pow(1.08, (s.charCode - 33)) - 1;
  return speed_final;
}

function dealWithSoftIdentifier(WeatherData) {

  var s = WeatherData.search(/[csgtrPphbLl][0123456789.]{2,5}/);
  var WeatherDataSplit = "";

  while (s != -1) {
    //Find a weatherData

    if (WeatherData != undefined) {

      if (WeatherData.charAt(s) == 'c') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) == 's') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) == 'g') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) == 't') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) == 'r') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) === 'P') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) === 'p') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) == 'h') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 3));
        WeatherData = WeatherData.substring(s + 3, WeatherData.length);

      } else if (WeatherData.charAt(s) == 'b') {

        if (WeatherData.charAt(s + 5) >= '0' && WeatherData.charAt(s + 5) <= '9') {
          WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 6));
          WeatherData = WeatherData.substring(s + 6, WeatherData.length);
        } else {
          WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 5));
          WeatherData = WeatherData.substring(s + 5, WeatherData.length);
        }

      } else if (WeatherData.charAt(s) === 'L') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 4));
        WeatherData = WeatherData.substring(s + 4, WeatherData.length);

      } else if (WeatherData.charAt(s) === 'l') {

        WeatherDataSplit = WeatherDataSplit.concat(WeatherData.substr(0, 5));
        WeatherData = WeatherData.substring(s + 5, WeatherData.length);
      }

    }

    //Split it and form a new String
    s = WeatherData.search(/[csgtrPphbLl][0123456789.]{2,5}/);
  }

  MachineIdentifier = WeatherData;

  var objectReturn = new Object;
  objectReturn.weather = WeatherDataSplit;
  objectReturn.machine = MachineIdentifier;

  return objectReturn;
}

function dealWithPath(data) {
	var arrayToReturn = new Array();
	var dataSplit = data.split(RegExp(",|>"));
	
	var indexOfArray = 0;
	for (var i = 0; i < dataSplit.length; i++) {
		if(isDataACallCodeUsingRegExp(dataSplit[i]) == 1) /* The condition of path data */ {			
			arrayToReturn[indexOfArray] = dataSplit[i].replace('*', '').trim();
			indexOfArray++;
		}		
	}
	
	return arrayToReturn;
}

function isDataACallCodeUsingRegExp(calldata) {
	
	if(calldata != undefined) {
	
		if(calldata.indexOf(RegExp('[Qq][Aa]')) != -1)
			return 0;
		else if(calldata.indexOf("WIDE") != -1) 
			return 0;
		else if(calldata.indexOf("RELAY") != -1)
			return 0;
		else if(calldata.indexOf("TRACE") != -1)
			return 0;
		else if(calldata.indexOf("TCP") != -1)
			return 0;
		else if(calldata.indexOf("APRS") != -1)
			return 0;
		else 
			return 1;
	}
}

client.on('error', function(error) {
  console.log('error' + error);
  //client.destory();
});

client.on('close', function() {
  console.log('Closed.\n');
  client.end();
});

client.on('end', function() {
  console.log('disconnected\n');
});
