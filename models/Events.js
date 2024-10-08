require('dotenv').config();
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Utils = require('../utils');
const { text } = require('express');
require('mongoose-type-email');

const eventSchema = new mongoose.Schema({
  eventdisplayname: {
    type: String,
    required: true
  },
  vendorcontactname: {
    type: String,
    required: true
  },
  vendorcontactemail: {
    type: mongoose.SchemaTypes.Email,
    required: true   
  },
  vendorcontactphone: {
    type: String,
    required: true
  },
  eventcategory: {
    type: String,
    required: true
  },
  eventtag: {
    type: [String], // changed to array of strings
    required: true
  },
  eventsaturdaytime: {
    type: String,
    required: true
  },
  eventsundaytime: {
    type: String,
    required: true
  },
  eventstallnumber: {
    type: String,
    required: true
  },
  eventdescription: {
    type: String,
    required: true
  },
  eventimage: {
    type: String,
    required: false //changed for testing, if we want to always have photos we can change this to true
  }
  //Add more fields as needed
}, { timestamps: true })

const eventModel = mongoose.model('Event', eventSchema)

module.exports = eventModel