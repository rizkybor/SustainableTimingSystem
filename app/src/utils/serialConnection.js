// src/utils/serialConnection.js
import { SerialPort } from "serialport";

export async function listPorts() {
  try {
    return await SerialPort.list();
  } catch (err) {
    return [];
  }
}
