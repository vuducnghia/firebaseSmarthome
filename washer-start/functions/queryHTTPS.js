'use strict';

const https = require('https');
const axios = require('axios');


exports.getDevices = async (token) => {

  const response = await axios.get('https://cloud.javisco.com:8086/files/devices.json', {
    headers: {
      'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJjb3VudHJ5IjpudWxsLCJzdWIiOiJ2dWR1Y25naGlhMTk5NkBnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRTaWV0TEtJMUFJcWltajhQQ3pDWFJlWHRxTXdlcmVET2oxMy9McFBhWExzYlExU2IyL2l2LiIsImFnZW50IjoiU3BlYWtlciIsInBob25lIjpudWxsLCJuYW1lIjoibmdoaWEiLCJleHAiOjYyMDE4OTkzNjc4LCJ1c2VySWQiOjIzNTksImlhdCI6MTUzODk5MzY3OCwiZW1haWwiOiJ2dWR1Y25naGlhMTk5NkBnbWFpbC5jb20ifQ.paF8fkdbCv5nevQ2EH_BFsIitEfdcMoaMQwobzXA3gT4pNhlxv0jm5j2ZG5lI5d5NR_x12VrAnm2Onn9pAAiTg'
    }
  });
  return response.data;
}

exports.turnOnOrOffDeviceHA = async (dataDevice, status) => {
  let url = 'https://' + dataDevice.netID + '.javisco.com:8443/api/services/switch/' + status + '?key=' + dataDevice.key;
  let data = JSON.stringify({
    "entity_id": dataDevice.deviceID
  })
  console.log(url);
  const response = await axios.post(url, data,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-HA-Access': dataDevice.key,
        'Connection': 'keep-alive'
      }
    });

  console.log('res', response.data)
  return response.data;
}

exports.turnOnOrOffDeviceWifi = async (dataDevice, status) => {
  let url = 'https://' + dataDevice.netID + '.javisco.com:8443/api/switch?key=' + dataDevice.key;
  let data = JSON.stringify([{
    "id": dataDevice.deviceID,
    "state": (status === "turn_on") ? "on" : "off"
  }])
  console.log(url, data);
  const response = await axios.post(url, data,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  console.log('res', response.data)
  return response.data;
}

exports.getStateDeviceHA = async (dataDevice) => {
  let url = 'https://' + dataDevice.netID + '.javisco.com:8443/api/states/' + dataDevice.deviceID + '?key=' + dataDevice.key;

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-HA-Access': dataDevice.key,
      'Connection': 'keep-alive'
    }
  });

  if (response.data.state === 'on') {
    return { on: true };
  } else {
    return { on: false };
  }
}

exports.getStateDeviceWifi = async (dataDevice) => {
  let url = 'https://' + dataDevice.netID + '.javisco.com:8443/api/state?key=' + dataDevice.key;
  console.log(url)
  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  });

  for (let i = 0; i < response.data.length; ++i) {
    if (dataDevice.deviceID === response.data[i].id) {
      if (response.data[i].state === 'on') {
        console.log(1111)
        return { on: true };
      } else {
        console.log(2222);
        return { on: false };
      }
    }
  };
}