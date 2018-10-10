'use strict';

const functions = require('firebase-functions');
const { smarthome } = require('actions-on-google');
const util = require('util');
const admin = require('firebase-admin');
const q = require('./queryHTTPS');
// Initialize Firebase
admin.initializeApp();
const firebaseRef = admin.database().ref('/');

exports.fakeauth = functions.https.onRequest((request, response) => {
  const responseurl = util.format('%s?code=%s&state=%s',
    decodeURIComponent(request.query.redirect_uri), 'xxxxxx',
    request.query.state);
  console.log(responseurl);
  return response.redirect(responseurl);
});

exports.faketoken = functions.https.onRequest((request, response) => {
  const grantType = request.query.grant_type
    ? request.query.grant_type : request.body.grant_type;
  const secondsInDay = 86400; // 60 * 60 * 24
  const HTTP_STATUS_OK = 200;
  console.log(`Grant type ${grantType}`);

  let obj;
  if (grantType === 'authorization_code') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: secondsInDay,
    };
  } else if (grantType === 'refresh_token') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      expires_in: secondsInDay,
    };
  }
  console.log('TOKEN', JSON.stringify(obj));
  response.status(HTTP_STATUS_OK)
    .json(obj);
});

const app = smarthome({
  debug: true,
  key: '<api-key>',
});

function _classifyTypeDevice(device) {
  let obj = {};
  if (device.id.toUpperCase().indexOf("SWITCH") >= 0) {
    if (device.type.toUpperCase() === "LIGHT") {
      obj.type = 'action.devices.types.LIGHT';
      obj.traits = [
        "action.devices.traits.OnOff",
        "action.devices.traits.Brightness",
        "action.devices.traits.ColorTemperature",
        "action.devices.traits.ColorSpectrum"
      ]
    } else if (device.type.toUpperCase() === "AIR CONDITIONER") {
      obj.type = 'action.devices.types.AC_UNIT';
      obj.traits = [
        "action.devices.traits.OnOff",
        "action.devices.traits.Modes",
        "action.devices.traits.TemperatureSetting",
        "action.devices.traits.Toggles",
        "action.devices.traits.FanSpeed"
      ];
    } else if (device.type.toUpperCase() === "FAN") {
      obj.type = 'action.devices.types.FAN';
      obj.traits = [
        "action.devices.traits.FanSpeed",
        "action.devices.traits.OnOff",
        "action.devices.traits.Modes",
        "action.devices.traits.Toggles"
      ];
    } else { // switch
      obj.type = 'action.devices.types.SWITCH';
      obj.traits = ["action.devices.traits.OnOff"]
    }
  } else if (device.id.toUpperCase().indexOf("SENSOR") >= 0) {
    if (device.type === "Temperature Sensor") {
      obj.type = 'action.devices.types.THERMOSTAT';
      obj.traits = ["action.devices.traits.TemperatureSetting"]
    }
  }

  return obj;
}

function _change_alias(alias) {
  var str = alias;
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.trim();

  return str;
}

function createListDevices(devices) {
  let arrDevice = [];

  devices.forEach(group => {
    group.devices.forEach(device => {
      let resultType = _classifyTypeDevice(device);
      if (resultType.type) {


        let detailDevice = {
          deviceInfo: {
            manufacturer: 'JAVIS Co',
            model: '123321',
            hwVersion: '1.0',
            swVersion: '1.0.1',
          },
          name: {
            name: device.name,
            nicknames: [device.name]
          },
          customData: {
            "key": group.key,
            "netID": group.netid,
            "deviceID": device.id,
            "type": group.type
          }
        };

        detailDevice.id = group.netid + _change_alias(device.id.replace(/\./g, "@@@"));
        detailDevice.type = resultType.type;
        detailDevice.traits = resultType.traits;

        arrDevice.push(detailDevice);
      }
    });
  });

  return arrDevice;
}

app.onSync((body) => {
  console.log(1111)
  let token = 'eyJhbGciOiJIUzUxMiJ9.eyJjb3VudHJ5IjpudWxsLCJzdWIiOiJ2dWR1Y25naGlhMTk5NkBnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRTaWV0TEtJMUFJcWltajhQQ3pDWFJlWHRxTXdlcmVET2oxMy9McFBhWExzYlExU2IyL2l2LiIsImFnZW50IjoiU3BlYWtlciIsInBob25lIjpudWxsLCJuYW1lIjoibmdoaWEiLCJleHAiOjYyMDE4OTkzNjc4LCJ1c2VySWQiOjIzNTksImlhdCI6MTUzODk5MzY3OCwiZW1haWwiOiJ2dWR1Y25naGlhMTk5NkBnbWFpbC5jb20ifQ.paF8fkdbCv5nevQ2EH_BFsIitEfdcMoaMQwobzXA3gT4pNhlxv0jm5j2ZG5lI5d5NR_x12VrAnm2Onn9pAAiTg'
  return q.getDevices(token).then(data => {
    console.log('DATA', data);
    console.log(typeof (data));
    console.log('body onSync', JSON.stringify(body));
    let arrDevice = createListDevices(data);
    console.log('ARR DEVICE', JSON.stringify(arrDevice));
    return {
      requestId: body.requestId,
      payload: {
        agentUserId: '123',
        devices: arrDevice,
      },
    };
  })
});

const queryFirebase = (deviceId) => firebaseRef.child(deviceId).once('value')
  .then((snapshot) => {
    const snapshotVal = snapshot.val();
    return {
      on: snapshotVal.OnOff.on,
      // isPaused: snapshotVal.StartStop.isPaused,
      // isRunning: snapshotVal.StartStop.isRunning,
    };
  });

// eslint-disable-next-line
const queryDevice = (deviceId) => queryFirebase(deviceId).then((data) => ({
  on: data.on,
  // isPaused: data.isPaused,
  // isRunning: data.isRunning,
}));

app.onQuery((body) => {
  console.log('onQuery', JSON.stringify(body));
  const { requestId } = body;
  const payload = {
    devices: {},
  };
  const queryPromises = [];
  for (const input of body.inputs) {
    for (const device of input.payload.devices) {
      const deviceId = device.id;

      if (device.customData.type === "Home Assistant") {
        queryPromises.push(
          q.getStateDeviceHA(device.customData).then(data => {
            payload.devices[deviceId] = data;
          })
        );
      } else {
        queryPromises.push(
          q.getStateDeviceWifi(device.customData).then(data => {
            console.log('res', data)
            payload.devices[deviceId] = data;
          })
        );
      }

    }
  }
  // Wait for all promises to resolve
  return Promise.all(queryPromises).then((values) => ({
    requestId: requestId,
    payload: payload,
  })
  );
});

app.onExecute(async (body) => {
  console.log('body onExecute', JSON.stringify(body));

  const { requestId } = body;
  const payload = {
    commands: [{
      ids: [],
      status: 'SUCCESS',
      states: {
        online: true,
      },
    }],
  };
  for (const input of body.inputs) {
    for (const command of input.payload.commands) {
      for (const device of command.devices) {
        const deviceId = device.id;
        payload.commands[0].ids.push(deviceId);
        for (const execution of command.execution) {
          const execCommand = execution.command;
          const { params } = execution;
          switch (execCommand) {
            case 'action.devices.commands.OnOff':
              let status = params.on ? "turn_on" : "turn_off";
              if (device.customData.type === "Home Assistant") {
                console.log('ha')
                await q.turnOnOrOffDeviceHA(device.customData, status);
              } else {
                console.log('wifi')
                await q.turnOnOrOffDeviceWifi(device.customData, status);
              }

              firebaseRef.child(deviceId).child('OnOff').update({
                on: params.on,
              });
              payload.commands[0].states.on = params.on;
              break;
            case 'action.devices.commands.StartStop':
              firebaseRef.child(deviceId).child('StartStop').update({
                isRunning: params.start,
              });
              payload.commands[0].states.isRunning = params.start;
              break;
            case 'action.devices.commands.PauseUnpause':
              firebaseRef.child(deviceId).child('StartStop').update({
                isPaused: params.pause,
              });
              payload.commands[0].states.isPaused = params.pause;
              break;
          }
        }
      }
    }
  }
  return {
    requestId: requestId,
    payload: payload,
  };
});

exports.smarthome = functions.https.onRequest(app);

exports.requestsync = functions.https.onRequest((request, response) => {
  console.info('Request SYNC for user 123');
  app.requestSync('123')
    .then((res) => {
      console.log('Request sync completed');
      response.json(data);
    }).catch((err) => {
      console.error(err);
    });
});

/**
 * Send a REPORT STATE call to the homegraph when data for any device id
 * has been changed.
 */
exports.reportstate = functions.database.ref('{deviceId}').onWrite((event) => {
  console.info('Firebase write event triggered this cloud function');
});


